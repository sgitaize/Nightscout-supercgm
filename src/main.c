#include <pebble.h>

#define ROWS 5

typedef enum {
  ROW_TYPE_WEATHER = 0,
  ROW_TYPE_TIME = 1,
  ROW_TYPE_DATE = 2,
  ROW_TYPE_WEEKDAY = 3,
  ROW_TYPE_BATTERY = 4,
  ROW_TYPE_BG = 5,
  ROW_TYPE_STEPS = 6
} RowType;

static Window *s_main_window;
static TextLayer *s_row_layers[ROWS];
static TextLayer *s_ghost_layers[ROWS];
static TextLayer *s_bg_trend_layer;
static GFont s_font_dseg_42;
static GColor s_row_colors[ROWS];
static GColor s_ghost_color;
static RowType s_row_types[ROWS];
static bool s_show_leading_zero = true;
static int s_date_format = 0; // 0: dd/mm, 1: mm/dd
static int s_weekday_lang = 0; // 0: de, 1: en
static int s_temp_unit_f = 0; // 0=C, 1=F
static char s_weather_buf[12];
static char s_bg_trend[8];
static int s_bg_unit_mmol = 0; // 0 mg/dL, 1 mmol

static int s_bg_sgv = -1; // -1 unknown
static time_t s_bg_timestamp = 0;
static int s_bg_timeout_min = 20;
static int s_bg_low = 80;
static int s_bg_high = 180;
static GColor s_col_low, s_col_high, s_col_in;
static uint32_t s_row_color_hex[ROWS];
static uint32_t s_col_low_hex, s_col_high_hex, s_col_in_hex, s_ghost_hex;

static GColor ColorFromHex(uint32_t hex) {
#if defined(PBL_COLOR)
  uint8_t r = (hex >> 16) & 0xFF;
  uint8_t g = (hex >> 8) & 0xFF;
  uint8_t b = (hex) & 0xFF;
  return GColorFromRGB(r, g, b);
#else
  // Map any color to black/white
  uint8_t lum = (uint8_t)( ((hex >> 16) & 0xFF)*3 + ((hex >> 8) & 0xFF)*6 + (hex & 0xFF) ) / 10;
  return lum > 127 ? GColorWhite : GColorBlack;
#endif
}

static void update_time(void);
static void request_weather(void);
static void request_bg(void);

static void set_text_with_ghost(TextLayer *layer, const char *text) {
  // Render a dark gray "8" behind the text for ghost effect
  GRect bounds = layer_get_bounds(text_layer_get_layer(layer));
  // Draw in update proc would be better; here we just set background and use second layer effect
  text_layer_set_background_color(layer, GColorClear);
  text_layer_set_text(layer, text);
}

static void layout_rows(void) {
  Layer *window_layer = window_get_root_layer(s_main_window);
  GRect bounds = layer_get_bounds(window_layer);
  int16_t row_height = bounds.size.h / ROWS;
  int bg_index = -1;
  for (int i = 0; i < ROWS; i++) {
    GRect frame = GRect(0, i * row_height, bounds.size.w, row_height);
  if (s_ghost_layers[i]) layer_set_frame(text_layer_get_layer(s_ghost_layers[i]), frame);
    layer_set_frame(text_layer_get_layer(s_row_layers[i]), frame);
    if (s_row_types[i] == ROW_TYPE_BG) bg_index = i;
  }
  if (s_bg_trend_layer) {
    if (bg_index >= 0) {
      // place trend on the right 40% of the BG row
      GRect frame = GRect(bounds.size.w * 3 / 5, bg_index * row_height, bounds.size.w - (bounds.size.w * 3 / 5), row_height);
      layer_set_hidden(text_layer_get_layer(s_bg_trend_layer), false);
      layer_set_frame(text_layer_get_layer(s_bg_trend_layer), frame);
    } else {
      layer_set_hidden(text_layer_get_layer(s_bg_trend_layer), true);
    }
  }
}

static void battery_handler(BatteryChargeState state) {
  // update battery row if present
  for (int i = 0; i < ROWS; i++) {
    if (s_row_types[i] == ROW_TYPE_BATTERY) {
      static char s_batt[8];
      snprintf(s_batt, sizeof(s_batt), "%d%%", state.charge_percent);
      text_layer_set_text(s_row_layers[i], s_batt);
    }
  }
}

static void health_handler(HealthEventType event, void *context) {
  if (event == HealthEventMovementUpdate) {
    HealthValue steps = health_service_sum_today(HealthMetricStepCount);
    for (int i = 0; i < ROWS; i++) {
      if (s_row_types[i] == ROW_TYPE_STEPS) {
        static char s_steps[16];
        snprintf(s_steps, sizeof(s_steps), "%ld", (long)steps);
        text_layer_set_text(s_row_layers[i], s_steps);
      }
    }
  }
}

static void draw_all_rows(void) {
  time_t now = time(NULL);
  struct tm *t = localtime(&now);

  // Time
  static char s_time[8];
  if (clock_is_24h_style()) {
    if (s_show_leading_zero) {
      strftime(s_time, sizeof(s_time), "%H:%M", t);
    } else {
      // Remove leading zero manually
      strftime(s_time, sizeof(s_time), "%H:%M", t);
      if (s_time[0] == '0') {
        s_time[0] = ' ';
      }
    }
  } else {
    strftime(s_time, sizeof(s_time), "%I:%M", t);
    if (!s_show_leading_zero && s_time[0] == '0') s_time[0] = ' ';
  }

  // Date
  static char s_date[8];
  if (s_date_format == 0) {
    strftime(s_date, sizeof(s_date), "%d/%m", t);
  } else {
    strftime(s_date, sizeof(s_date), "%m/%d", t);
  }

  // Weekday
  static char s_wd[4];
  if (s_weekday_lang == 1) {
    // English
    strftime(s_wd, sizeof(s_wd), "%a", t); // e.g., Wed
  } else {
    // German custom 3-letter: Mon->MON, Wed->MIT
    const char *wd_de[7] = {"SON","MON","DIE","MIT","DON","FRE","SAM"};
    s_wd[0] = 0;
    strncpy(s_wd, wd_de[t->tm_wday], sizeof(s_wd));
  }

  // Battery handled by callback, but refresh now too
  BatteryChargeState batt_state = battery_state_service_peek();
  battery_handler(batt_state);

  // Steps (ensure initial fill as health event may not fire immediately)
  HealthValue steps_now = health_service_sum_today(HealthMetricStepCount);

  // BG line
  static char s_bg[16];
  if (s_bg_sgv < 0) {
    snprintf(s_bg, sizeof(s_bg), "NO-BG");
  } else {
    // staleness
    int age_min = (int)((now - s_bg_timestamp) / 60);
    if (age_min > s_bg_timeout_min) {
      snprintf(s_bg, sizeof(s_bg), "NoCon");
    } else {
  const char *unit = s_bg_unit_mmol ? " mmol" : " mg"; // minimal suffix; no conversion
  snprintf(s_bg, sizeof(s_bg), "%d%s", s_bg_sgv, unit);
    }
  }

  // Assign texts and colors per row
  for (int i = 0; i < ROWS; i++) {
    TextLayer *layer = s_row_layers[i];
    GColor color = s_row_colors[i];

    switch (s_row_types[i]) {
      case ROW_TYPE_TIME:
        text_layer_set_text(layer, s_time);
        break;
      case ROW_TYPE_DATE:
        text_layer_set_text(layer, s_date);
        break;
      case ROW_TYPE_WEEKDAY:
        text_layer_set_text(layer, s_wd);
        break;
      case ROW_TYPE_BATTERY:
        // set in battery handler; color red if low
        if (batt_state.charge_percent <= 10) {
          color = GColorRed;
        }
        break;
      case ROW_TYPE_BG: {
        // Color by thresholds
        if (s_bg_sgv >= 0) {
          if (s_bg_sgv < s_bg_low) color = s_col_low;
          else if (s_bg_sgv > s_bg_high) color = s_col_high;
          else color = s_col_in;
      }
        text_layer_set_text(layer, s_bg);
        // trend overlay
        if (s_bg_trend_layer) {
          text_layer_set_text_color(s_bg_trend_layer, color);
          text_layer_set_text(s_bg_trend_layer, s_bg_trend);
        }
        break;
      }
      case ROW_TYPE_WEATHER:
        // text set by inbox message; ensure default
        if (strlen(s_weather_buf) == 0) {
          snprintf(s_weather_buf, sizeof(s_weather_buf), "--");
        }
        text_layer_set_text(layer, s_weather_buf);
        break;
      case ROW_TYPE_STEPS:
        {
          static char s_steps[16];
          snprintf(s_steps, sizeof(s_steps), "%ld", (long)steps_now);
          text_layer_set_text(layer, s_steps);
        }
        break;
    }

    text_layer_set_text_color(layer, color);
  }
}

static void tick_handler(struct tm *tick_time, TimeUnits units_changed) {
  if (units_changed & MINUTE_UNIT) {
    update_time();
  }
}

static void update_time(void) {
  draw_all_rows();
  // ask for updates
  request_weather();
  request_bg();
}

// Messaging
static void inbox_received_callback(DictionaryIterator *iter, void *context) {
  Tuple *t;

  if ((t = dict_find(iter, MESSAGE_KEY_WEATHER_TEMP))) {
    // Put temp with unit symbol in any weather row
    char symbol = s_temp_unit_f ? 'F' : 'C';
    snprintf(s_weather_buf, sizeof(s_weather_buf), "%ld°%c", t->value->int32, symbol);
    for (int i = 0; i < ROWS; i++) if (s_row_types[i] == ROW_TYPE_WEATHER) text_layer_set_text(s_row_layers[i], s_weather_buf);
  }
  if ((t = dict_find(iter, MESSAGE_KEY_BG_SGV))) {
    s_bg_sgv = (int)t->value->int32;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_TEMP_UNIT))) {
    s_temp_unit_f = t->value->int32 ? 1 : 0;
  }

  // If weather not provided in this message but a weather row exists and no previous string, set default '--'
  bool has_weather_row = false;
  for (int i=0;i<ROWS;i++) if (s_row_types[i]==ROW_TYPE_WEATHER) { has_weather_row=true; break; }
  if (has_weather_row && strlen(s_weather_buf) == 0) {
    snprintf(s_weather_buf, sizeof(s_weather_buf), "--");
    for (int i = 0; i < ROWS; i++) if (s_row_types[i] == ROW_TYPE_WEATHER) text_layer_set_text(s_row_layers[i], s_weather_buf);
  }
  if ((t = dict_find(iter, MESSAGE_KEY_BG_TIMESTAMP))) {
    s_bg_timestamp = (time_t)t->value->int32;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_BG_STATUS))) {
    // 0 ok, 1 no bg, 2 stale
    if (t->value->int32 == 1) {
      s_bg_sgv = -1;
    }
  }
  if ((t = dict_find(iter, MESSAGE_KEY_BG_UNIT))) {
    s_bg_unit_mmol = t->value->int32 ? 1 : 0;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_BG_TREND))) {
    strncpy(s_bg_trend, t->value->cstring, sizeof(s_bg_trend));
    s_bg_trend[sizeof(s_bg_trend)-1] = 0;
  }

  // Config
  if ((t = dict_find(iter, MESSAGE_KEY_SHOW_LEADING_ZERO))) {
    s_show_leading_zero = t->value->int32 != 0;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_DATE_FORMAT))) {
    s_date_format = t->value->int32;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_WEEKDAY_LANG))) {
    s_weekday_lang = t->value->int32;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_BG_TIMEOUT_MIN))) {
    s_bg_timeout_min = t->value->int32;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_BG_THRESH_LOW))) {
    s_bg_low = t->value->int32;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_BG_THRESH_HIGH))) {
    s_bg_high = t->value->int32;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_COLOR_LOW))) {
  s_col_low_hex = (uint32_t)t->value->int32; s_col_low = ColorFromHex(s_col_low_hex);
  }
  if ((t = dict_find(iter, MESSAGE_KEY_COLOR_HIGH))) {
  s_col_high_hex = (uint32_t)t->value->int32; s_col_high = ColorFromHex(s_col_high_hex);
  }
  if ((t = dict_find(iter, MESSAGE_KEY_COLOR_IN_RANGE))) {
  s_col_in_hex = (uint32_t)t->value->int32; s_col_in = ColorFromHex(s_col_in_hex);
  }
  if ((t = dict_find(iter, MESSAGE_KEY_GHOST_COLOR))) {
  s_ghost_hex = (uint32_t)t->value->int32; s_ghost_color = ColorFromHex(s_ghost_hex);
  for (int i = 0; i < ROWS; i++) if (s_ghost_layers[i]) text_layer_set_text_color(s_ghost_layers[i], s_ghost_color);
  }

  for (int i = 0; i < ROWS; i++) {
    int key_type = MESSAGE_KEY_ROW1_TYPE + i; // relies on ordering
    int key_color = MESSAGE_KEY_ROW1_COLOR + i;
    if ((t = dict_find(iter, key_type))) s_row_types[i] = (RowType)t->value->int32;
    if ((t = dict_find(iter, key_color))) { s_row_color_hex[i] = (uint32_t)t->value->int32; s_row_colors[i] = ColorFromHex(s_row_color_hex[i]); }
  }

  draw_all_rows();

  // persist after applying
  // Save primitive fields and arrays
    // No persistence (per request)
}

static void inbox_dropped_callback(AppMessageResult reason, void *context) {}
static void outbox_failed_callback(DictionaryIterator *iter, AppMessageResult reason, void *context) {}
static void outbox_sent_callback(DictionaryIterator *iter, void *context) {}

static void request_weather(void) {
  DictionaryIterator *iter;
  if (app_message_outbox_begin(&iter) == APP_MSG_OK) {
    dict_write_int32(iter, MESSAGE_KEY_REQUEST_WEATHER, 1);
    app_message_outbox_send();
  }
}

static void request_bg(void) {
  DictionaryIterator *iter;
  if (app_message_outbox_begin(&iter) == APP_MSG_OK) {
    dict_write_int32(iter, MESSAGE_KEY_REQUEST_BG, 1);
    app_message_outbox_send();
  }
}

static void main_window_load(Window *window) {
  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(window_layer);

  for (int i = 0; i < ROWS; i++) {
  // Ghost background layer
  s_ghost_layers[i] = text_layer_create(GRect(0, i * bounds.size.h / ROWS, bounds.size.w, bounds.size.h / ROWS));
  text_layer_set_background_color(s_ghost_layers[i], GColorClear);
  text_layer_set_text_alignment(s_ghost_layers[i], GTextAlignmentCenter);
  text_layer_set_text_color(s_ghost_layers[i], s_ghost_color);
  text_layer_set_text(s_ghost_layers[i], "8");
  if (s_font_dseg_42) text_layer_set_font(s_ghost_layers[i], s_font_dseg_42);
  layer_add_child(window_layer, text_layer_get_layer(s_ghost_layers[i]));

    s_row_layers[i] = text_layer_create(GRect(0, i * bounds.size.h / ROWS, bounds.size.w, bounds.size.h / ROWS));
    text_layer_set_background_color(s_row_layers[i], GColorClear);
    text_layer_set_text_alignment(s_row_layers[i], GTextAlignmentCenter);
    text_layer_set_text_color(s_row_layers[i], GColorWhite);
    if (s_font_dseg_42) {
      text_layer_set_font(s_row_layers[i], s_font_dseg_42);
    }
    layer_add_child(window_layer, text_layer_get_layer(s_row_layers[i]));
  }

  // Trend layer (system font), hidden until BG row exists
  s_bg_trend_layer = text_layer_create(GRect(bounds.size.w * 3 / 5, 0, bounds.size.w * 2 / 5, bounds.size.h / ROWS));
  text_layer_set_background_color(s_bg_trend_layer, GColorClear);
  text_layer_set_text_alignment(s_bg_trend_layer, GTextAlignmentRight);
  text_layer_set_text_color(s_bg_trend_layer, GColorWhite);
  text_layer_set_font(s_bg_trend_layer, fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD));
  text_layer_set_text(s_bg_trend_layer, "");
  layer_set_hidden(text_layer_get_layer(s_bg_trend_layer), true);
  layer_add_child(window_layer, text_layer_get_layer(s_bg_trend_layer));

  layout_rows();
  draw_all_rows();
}

static void main_window_unload(Window *window) {
  for (int i = 0; i < ROWS; i++) {
  text_layer_destroy(s_ghost_layers[i]);
    text_layer_destroy(s_row_layers[i]);
  }
  text_layer_destroy(s_bg_trend_layer);
}

static void init_defaults(void) {
  // Defaults
  for (int i = 0; i < ROWS; i++) {
    s_row_types[i] = (i == 0) ? ROW_TYPE_TIME : (i == 1 ? ROW_TYPE_BG : ROW_TYPE_DATE);
    s_row_color_hex[i] = 0xFFFFFF; s_row_colors[i] = ColorFromHex(s_row_color_hex[i]);
  }
  s_ghost_hex = 0x333333; s_ghost_color = ColorFromHex(s_ghost_hex);
  s_col_low_hex = 0xFF0000; s_col_low = ColorFromHex(s_col_low_hex);
  s_col_high_hex = 0xFFFF00; s_col_high = ColorFromHex(s_col_high_hex);
  s_col_in_hex = 0x00FF00; s_col_in = ColorFromHex(s_col_in_hex);
}

static void init(void) {
  init_defaults();

  // Load persisted config if available
  if (persist_exists(101)) persist_read_data(101, s_row_types, sizeof(s_row_types));
  if (persist_exists(102)) { persist_read_data(102, s_row_color_hex, sizeof(s_row_color_hex)); for (int i=0;i<ROWS;i++) s_row_colors[i] = ColorFromHex(s_row_color_hex[i]); }
  if (persist_exists(103)) s_show_leading_zero = persist_read_bool(103);
  if (persist_exists(104)) s_date_format = persist_read_int(104);
  if (persist_exists(105)) s_weekday_lang = persist_read_int(105);
  if (persist_exists(106)) s_bg_timeout_min = persist_read_int(106);
  if (persist_exists(107)) s_bg_low = persist_read_int(107);
  if (persist_exists(108)) s_bg_high = persist_read_int(108);
  if (persist_exists(109)) { s_col_low_hex = persist_read_int(109); s_col_low = ColorFromHex(s_col_low_hex);} 
  if (persist_exists(110)) { s_col_high_hex = persist_read_int(110); s_col_high = ColorFromHex(s_col_high_hex);} 
  if (persist_exists(111)) { s_col_in_hex = persist_read_int(111); s_col_in = ColorFromHex(s_col_in_hex);} 
  if (persist_exists(112)) { s_ghost_hex = persist_read_int(112); s_ghost_color = ColorFromHex(s_ghost_hex);} 

  // Load font before creating/pushing window so layers can use it in load()
  s_font_dseg_42 = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FONT_DSEG_42));

  s_main_window = window_create();
  window_set_background_color(s_main_window, GColorBlack);
  window_set_window_handlers(s_main_window, (WindowHandlers) {
    .load = main_window_load,
    .unload = main_window_unload
  });
  window_stack_push(s_main_window, true);

  // Services
  tick_timer_service_subscribe(MINUTE_UNIT, tick_handler);
  battery_state_service_subscribe(battery_handler);
  health_service_events_subscribe(health_handler, NULL);

  // Messaging
  app_message_register_inbox_received(inbox_received_callback);
  app_message_register_inbox_dropped(inbox_dropped_callback);
  app_message_register_outbox_failed(outbox_failed_callback);
  app_message_register_outbox_sent(outbox_sent_callback);
  app_message_open(1024, 256);

  update_time();
}

static void deinit(void) {
  tick_timer_service_unsubscribe();
  battery_state_service_unsubscribe();
  health_service_events_unsubscribe();

  fonts_unload_custom_font(s_font_dseg_42);

  window_destroy(s_main_window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}
