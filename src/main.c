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
static TextLayer *s_digit_layers[ROWS][5];
static TextLayer *s_ghost_layers[ROWS][5];
static Layer *s_ghost_hatch_layers[ROWS][5];
static Layer *s_bg_trend_layer;
static GColor s_bg_trend_color;
static Layer *s_weather_deg_layer;
static GColor s_weather_deg_color;
// Persistent 1-char + NUL buffers for each foreground slot
static char s_slot_text[ROWS][5][2];
static GFont s_font_dseg_30;       // Bold (foreground)
static GFont s_font_dseg_30_reg;   // Regular (ghost)
static GFont s_font_system_30;
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
static void draw_all_rows(void);
static void trend_update_proc(Layer *layer, GContext *ctx);
static void weather_deg_update_proc(Layer *layer, GContext *ctx);

// helpers to detect UTF-8 arrows and ASCII fallbacks
static bool contains_utf8(const char *s, const char *needle) {
  return s && needle && strstr(s, needle) != NULL;
}

// Persisted configuration cache
#define PERSIST_CONFIG_KEY 1001
typedef struct {
  int version; // bump when fields change
  RowType row_types[ROWS];
  uint32_t row_color_hex[ROWS];
  uint32_t ghost_hex;
  int show_leading_zero;
  int date_format;
  int weekday_lang;
  int temp_unit_f;
  int bg_timeout_min;
  int bg_low;
  int bg_high;
  uint32_t col_low_hex;
  uint32_t col_high_hex;
  uint32_t col_in_hex;
} ConfigCache;

static void save_config_cache(void);
static void load_config_cache(void);

// Hatch overlay: thin black vertical stripes reduce the fill of the ghost glyphs
static void hatch_update_proc(Layer *layer, GContext *ctx) {
  GRect b = layer_get_bounds(layer);
  graphics_context_set_fill_color(ctx, GColorBlack);
  // 1px stripe every 3px across the slot
  for (int x = 0; x < b.size.w; x += 3) {
    graphics_fill_rect(ctx, GRect(x, 0, 1, b.size.h), 0, GCornerNone);
  }
}

// No-op helper removed; per-slot layering handles ghost

static void layout_rows(void) {
  Layer *window_layer = window_get_root_layer(s_main_window);
  GRect bounds = layer_get_bounds(window_layer);
  int16_t row_height = bounds.size.h / ROWS;
  int16_t slot_w = bounds.size.w / 5;
  int16_t left_pad = (bounds.size.w - slot_w * 5) / 2;
  int bg_index = -1;
  int weather_index = -1;
  for (int i = 0; i < ROWS; i++) {
    for (int c = 0; c < 5; c++) {
      GRect frame = GRect(left_pad + c * slot_w, i * row_height, slot_w, row_height);
      if (s_ghost_layers[i][c]) layer_set_frame(text_layer_get_layer(s_ghost_layers[i][c]), frame);
  if (s_ghost_hatch_layers[i][c]) layer_set_frame(s_ghost_hatch_layers[i][c], frame);
      if (s_digit_layers[i][c]) layer_set_frame(text_layer_get_layer(s_digit_layers[i][c]), frame);
    }
    if (s_row_types[i] == ROW_TYPE_BG) bg_index = i;
    if (s_row_types[i] == ROW_TYPE_WEATHER) weather_index = i;
  }
  if (s_bg_trend_layer) {
    if (bg_index >= 0) {
      // place trend on the right 40% of the BG row
      GRect frame = GRect(bounds.size.w * 3 / 5, bg_index * row_height, bounds.size.w - (bounds.size.w * 3 / 5), row_height);
      layer_set_hidden(s_bg_trend_layer, false);
      layer_set_frame(s_bg_trend_layer, frame);
    } else {
      layer_set_hidden(s_bg_trend_layer, true);
    }
  }
  if (s_weather_deg_layer) {
    if (weather_index >= 0) {
      // will be positioned precisely in draw_all_rows
      GRect frame = GRect(left_pad + slot_w * 4, weather_index * row_height, slot_w, row_height);
      layer_set_hidden(s_weather_deg_layer, false);
      layer_set_frame(s_weather_deg_layer, frame);
    } else {
      layer_set_hidden(s_weather_deg_layer, true);
    }
  }
}

static void battery_handler(BatteryChargeState state) { draw_all_rows(); }

static void health_handler(HealthEventType event, void *context) { if (event == HealthEventMovementUpdate) draw_all_rows(); }

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
  static char s_wd_padded[8];
  if (s_weekday_lang == 1) {
    // English -> uppercase 3-letter
    strftime(s_wd, sizeof(s_wd), "%a", t); // e.g., Wed
    for (int i=0; s_wd[i] && i < (int)sizeof(s_wd)-1; i++) {
      if (s_wd[i] >= 'a' && s_wd[i] <= 'z') s_wd[i] = (char)(s_wd[i] - 'a' + 'A');
    }
  } else {
    // German custom 3-letter: Mon->MON, Wed->MIT
    const char *wd_de[7] = {"SON","MON","DIE","MIT","DON","FRE","SAM"};
    s_wd[0] = 0;
    strncpy(s_wd, wd_de[t->tm_wday], sizeof(s_wd));
  }
  // Right-align weekday in 5-character grid: e.g., "  MIT"
  memset(s_wd_padded, ' ', sizeof(s_wd_padded));
  s_wd_padded[5] = '\0';
  size_t len = strlen(s_wd);
  size_t start = (len < 5) ? (5 - len) : 0;
  for (size_t i = 0; i < len && (start + i) < 5; ++i) s_wd_padded[start + i] = s_wd[i];

  // Current battery and steps snapshot
  BatteryChargeState batt_state = battery_state_service_peek();
  HealthValue steps_now = health_service_sum_today(HealthMetricStepCount);

  // BG line
  static char s_bg[16];
  if (s_bg_sgv < 0) {
    snprintf(s_bg, sizeof(s_bg), "NO-BG");
  } else {
    // staleness
    int age_min = (int)((now - s_bg_timestamp) / 60);
    if (age_min > s_bg_timeout_min) {
      snprintf(s_bg, sizeof(s_bg), "NOCON");
    } else {
  // Keep BG numeric-only to preserve monospaced grid
  snprintf(s_bg, sizeof(s_bg), "%d", s_bg_sgv);
    }
  }

  // Battery
  static char s_batt[6];
  snprintf(s_batt, sizeof(s_batt), "%3d%%", batt_state.charge_percent);

  // Steps
  static char s_steps[8];
  snprintf(s_steps, sizeof(s_steps), "%5ld", (long)steps_now);

  // Assign texts and colors per row into 5 slots
  for (int i = 0; i < ROWS; i++) {
  GColor color = s_row_colors[i];
    // Build a 5-char buffer for this row
    char slots[6] = {' ', ' ', ' ', ' ', ' ', 0};

    switch (s_row_types[i]) {
      case ROW_TYPE_TIME:
        // Expect s_time like HH:MM (5 chars)
        strncpy(slots, s_time, 5);
        break;
      case ROW_TYPE_DATE:
        strncpy(slots, s_date, 5);
        break;
      case ROW_TYPE_WEEKDAY:
  // Already right-aligned into s_wd_padded
  strncpy(slots, s_wd_padded, 5);
        break;
      case ROW_TYPE_BATTERY:
        // color red if low
        if (batt_state.charge_percent <= 10) {
          color = GColorRed;
        }
        {
          // right-align within 5 slots
          size_t bl = strlen(s_batt); if (bl > 5) bl = 5;
          int bstart = (int)(5 - bl);
          for (size_t k=0;k<bl;k++) slots[bstart + k] = s_batt[k];
        }
        break;
      case ROW_TYPE_BG: {
        // Color by thresholds
        if (s_bg_sgv >= 0) {
          if (s_bg_sgv < s_bg_low) color = s_col_low;
          else if (s_bg_sgv > s_bg_high) color = s_col_high;
          else color = s_col_in;
      }
        // Center s_bg in 5 slots
        size_t l = strlen(s_bg); if (l > 5) l = 5;
        int start = (5 - (int)l) / 2;
        for (size_t k=0;k<l;k++) slots[start + k] = s_bg[k];
        // trend overlay
        if (s_bg_trend_layer && s_bg_sgv >= 0) {
          s_bg_trend_color = color;
          // position to the first free slot right of the number
          Layer *window_layer = window_get_root_layer(s_main_window);
          GRect bounds = layer_get_bounds(window_layer);
          int16_t row_h = bounds.size.h / ROWS;
          int16_t slot_w = bounds.size.w / 5;
          int16_t left_pad = (bounds.size.w - slot_w * 5) / 2;
          int slot_index = start + (int)l; if (slot_index > 4) slot_index = 4; if (slot_index < 0) slot_index = 0;
          GRect frame = GRect(left_pad + slot_index * slot_w, i * row_h, slot_w, row_h);
          layer_set_frame(s_bg_trend_layer, frame);
          layer_set_hidden(s_bg_trend_layer, false);
          layer_mark_dirty(s_bg_trend_layer);
        } else if (s_bg_trend_layer) {
          layer_set_hidden(s_bg_trend_layer, true);
        }
        break;
      }
      case ROW_TYPE_WEATHER: {
        // Ensure default and fit into 5 slots; strip degree symbol and draw as overlay
        if (strlen(s_weather_buf) == 0) {
          snprintf(s_weather_buf, sizeof(s_weather_buf), "--");
        }
        // build temp without '°'
        char temp_no_deg[8]; size_t p = 0;
        for (size_t q = 0; q < strlen(s_weather_buf) && p < sizeof(temp_no_deg)-1; q++) {
          // UTF-8 degree 0xC2 0xB0
          if ((unsigned char)s_weather_buf[q] == 0xC2 && (unsigned char)s_weather_buf[q+1] == 0xB0) { q++; continue; }
          if ((unsigned char)s_weather_buf[q] == 0xB0) { continue; }
          temp_no_deg[p++] = s_weather_buf[q];
        }
        temp_no_deg[p] = 0;
        // center temp string in 5 slots
        char temp5[6] = {' ', ' ', ' ', ' ', ' ', 0};
        size_t l2 = strlen(temp_no_deg); if (l2 > 5) l2 = 5;
        int start2 = (5 - (int)l2) / 2;
        for (size_t k=0;k<l2;k++) temp5[start2 + k] = temp_no_deg[k];
        memcpy(slots, temp5, 6);

        // place degree overlay near the unit char (C/F)
        int unit_idx = -1;
        for (size_t k=0;k<l2; k++) { if (temp_no_deg[k]=='C' || temp_no_deg[k]=='F') { unit_idx = (int)k; break; } }
        if (s_weather_deg_layer && unit_idx >= 0) {
          Layer *window_layer = window_get_root_layer(s_main_window);
          GRect bounds = layer_get_bounds(window_layer);
          int16_t row_h = bounds.size.h / ROWS;
          int16_t slot_w = bounds.size.w / 5;
          int16_t left_pad = (bounds.size.w - slot_w * 5) / 2;
          int slot_index = start2 + unit_idx; if (slot_index < 0) slot_index = 0; if (slot_index > 4) slot_index = 4;
          // anchor inside that slot, top-left corner
          GRect frame = GRect(left_pad + slot_index * slot_w + 2, i * row_h + 4, 8, 8);
          s_weather_deg_color = color;
          layer_set_frame(s_weather_deg_layer, frame);
          layer_set_hidden(s_weather_deg_layer, false);
          layer_mark_dirty(s_weather_deg_layer);
        } else if (s_weather_deg_layer) {
          layer_set_hidden(s_weather_deg_layer, true);
        }
        break;
      }
      case ROW_TYPE_STEPS:
        strncpy(slots, s_steps, 5);
        break;
    }

    // Apply to slots and set fonts/colors
    for (int c = 0; c < 5; c++) {
      // Prepare persistent buffer for this slot
      s_slot_text[i][c][0] = slots[c];
      s_slot_text[i][c][1] = 0;
      // Ghost always "8"
      if (s_ghost_layers[i][c]) {
        text_layer_set_text(s_ghost_layers[i][c], "8");
        text_layer_set_text_color(s_ghost_layers[i][c], s_ghost_color);
        if (s_font_dseg_30_reg) text_layer_set_font(s_ghost_layers[i][c], s_font_dseg_30_reg);
      }
      if (s_digit_layers[i][c]) {
        text_layer_set_text(s_digit_layers[i][c], s_slot_text[i][c]);
  // Apply per-row color so digits are not black
  text_layer_set_text_color(s_digit_layers[i][c], color);
  // Keep transparent background so ghost '8' shows except where glyph pixels render
  text_layer_set_background_color(s_digit_layers[i][c], GColorClear);
  // Always use DSEG for visual consistency across digits and letters
  if (s_font_dseg_30) text_layer_set_font(s_digit_layers[i][c], s_font_dseg_30);
      }
    }
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
  // BG fetching is scheduled on the phone side at a configurable interval
}

// Messaging
static void inbox_received_callback(DictionaryIterator *iter, void *context) {
  Tuple *t;

  if ((t = dict_find(iter, MESSAGE_KEY_WEATHER_TEMP))) {
    // Put temp with unit symbol in any weather row
    char symbol = s_temp_unit_f ? 'F' : 'C';
    snprintf(s_weather_buf, sizeof(s_weather_buf), "%ld°%c", t->value->int32, symbol);
  // Re-render rows; per-slot renderer will place it appropriately
  draw_all_rows();
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
  draw_all_rows();
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
  for (int i = 0; i < ROWS; i++) {
    for (int c = 0; c < 5; c++) {
      if (s_ghost_layers[i][c]) text_layer_set_text_color(s_ghost_layers[i][c], s_ghost_color);
    }
  }
  }

  for (int i = 0; i < ROWS; i++) {
    int key_type = MESSAGE_KEY_ROW1_TYPE + i; // relies on ordering
    int key_color = MESSAGE_KEY_ROW1_COLOR + i;
    if ((t = dict_find(iter, key_type))) s_row_types[i] = (RowType)t->value->int32;
    if ((t = dict_find(iter, key_color))) { s_row_color_hex[i] = (uint32_t)t->value->int32; s_row_colors[i] = ColorFromHex(s_row_color_hex[i]); }
  }

  draw_all_rows();

  // persist after applying
  save_config_cache();
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
  // Stelle sicher, dass die gespeicherte Konfiguration geladen wird
  load_config_cache();
  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(window_layer);

  int16_t row_h = bounds.size.h / ROWS;
  int16_t slot_w = bounds.size.w / 5;
  int16_t left_pad = (bounds.size.w - slot_w * 5) / 2;
  for (int i = 0; i < ROWS; i++) {
    for (int c = 0; c < 5; c++) {
      GRect frame = GRect(left_pad + c * slot_w, i * row_h, slot_w, row_h);
      // Ghost layer
      s_ghost_layers[i][c] = text_layer_create(frame);
      text_layer_set_background_color(s_ghost_layers[i][c], GColorClear);
      text_layer_set_text_alignment(s_ghost_layers[i][c], GTextAlignmentCenter);
      text_layer_set_text_color(s_ghost_layers[i][c], s_ghost_color);
      text_layer_set_text(s_ghost_layers[i][c], "8");
  if (s_font_dseg_30_reg) text_layer_set_font(s_ghost_layers[i][c], s_font_dseg_30_reg);
      layer_add_child(window_layer, text_layer_get_layer(s_ghost_layers[i][c]));
  // Hatch overlay above ghost, below foreground
  s_ghost_hatch_layers[i][c] = layer_create(frame);
  layer_set_update_proc(s_ghost_hatch_layers[i][c], hatch_update_proc);
  layer_add_child(window_layer, s_ghost_hatch_layers[i][c]);
      // Foreground layer
      s_digit_layers[i][c] = text_layer_create(frame);
      text_layer_set_background_color(s_digit_layers[i][c], GColorClear);
      text_layer_set_text_alignment(s_digit_layers[i][c], GTextAlignmentCenter);
      text_layer_set_text_color(s_digit_layers[i][c], GColorWhite);
      if (s_font_dseg_30) text_layer_set_font(s_digit_layers[i][c], s_font_dseg_30);
      layer_add_child(window_layer, text_layer_get_layer(s_digit_layers[i][c]));
    }
  }

  // Trend layer (custom draw), hidden until BG row exists
  s_bg_trend_layer = layer_create(GRect(bounds.size.w * 3 / 5, 0, bounds.size.w * 2 / 5, bounds.size.h / ROWS));
  layer_set_hidden(s_bg_trend_layer, true);
  layer_set_update_proc(s_bg_trend_layer, trend_update_proc);
  layer_add_child(window_layer, s_bg_trend_layer);

  // Weather degree overlay
  s_weather_deg_layer = layer_create(GRect(bounds.size.w * 4 / 5, 0, bounds.size.w / 5, bounds.size.h / ROWS));
  layer_set_hidden(s_weather_deg_layer, true);
  layer_set_update_proc(s_weather_deg_layer, weather_deg_update_proc);
  layer_add_child(window_layer, s_weather_deg_layer);

  layout_rows();
  draw_all_rows();
}

static void main_window_unload(Window *window) {
  for (int i = 0; i < ROWS; i++) {
    for (int c = 0; c < 5; c++) {
  if (s_ghost_hatch_layers[i][c]) { layer_destroy(s_ghost_hatch_layers[i][c]); s_ghost_hatch_layers[i][c] = NULL; }
  text_layer_destroy(s_ghost_layers[i][c]);
      text_layer_destroy(s_digit_layers[i][c]);
    }
  }
  if (s_bg_trend_layer) { layer_destroy(s_bg_trend_layer); s_bg_trend_layer = NULL; }
  if (s_weather_deg_layer) { layer_destroy(s_weather_deg_layer); s_weather_deg_layer = NULL; }
}

static void init_defaults(void) {
  // Defaults: 1 Weather, 2 Time, 3 Date, 4 Weekday, 5 CGM
  s_row_types[0] = ROW_TYPE_WEATHER;
  s_row_types[1] = ROW_TYPE_TIME;
  s_row_types[2] = ROW_TYPE_DATE;
  s_row_types[3] = ROW_TYPE_WEEKDAY;
  s_row_types[4] = ROW_TYPE_BG;
  // Default colors (for color display):
  s_row_color_hex[0] = 0x00FFFF; // Weather cyan
  s_row_color_hex[1] = 0xFFFFFF; // Time white
  s_row_color_hex[2] = 0xAAAAAA; // Date light gray
  s_row_color_hex[3] = 0xAAAAAA; // Weekday light gray
  s_row_color_hex[4] = 0x00FF00; // CGM default green (overridden by thresholds if BG present)
  for (int i=0;i<ROWS;i++) s_row_colors[i] = ColorFromHex(s_row_color_hex[i]);
  // Ghost grid color: lighter gray for clear visibility on black
  s_ghost_hex = 0x555555; s_ghost_color = ColorFromHex(s_ghost_hex);
  s_col_low_hex = 0xFF0000; s_col_low = ColorFromHex(s_col_low_hex);
  s_col_high_hex = 0xFFFF00; s_col_high = ColorFromHex(s_col_high_hex);
  s_col_in_hex = 0x00FF00; s_col_in = ColorFromHex(s_col_in_hex);
}


static void init(void) {
  // Nur Defaults setzen, wenn keine persistierte Konfiguration existiert
  if (!persist_exists(PERSIST_CONFIG_KEY)) {
    init_defaults();
  } else {
    load_config_cache();
  }

  // Load fonts before creating/pushing window so layers can use them in load()
  s_font_dseg_30 = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FONT_DSEG_30_BOLD));
  s_font_dseg_30_reg = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FONT_DSEG_30_REG));
  s_font_system_30 = fonts_get_system_font(FONT_KEY_BITHAM_30_BLACK);

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

  fonts_unload_custom_font(s_font_dseg_30);
  if (s_font_dseg_30_reg) fonts_unload_custom_font(s_font_dseg_30_reg);

  window_destroy(s_main_window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}

static void save_config_cache(void) {
  ConfigCache cc;
  cc.version = 1;
  for (int i=0;i<ROWS;i++) { cc.row_types[i] = s_row_types[i]; cc.row_color_hex[i] = s_row_color_hex[i]; }
  cc.ghost_hex = s_ghost_hex;
  cc.show_leading_zero = s_show_leading_zero ? 1 : 0;
  cc.date_format = s_date_format;
  cc.weekday_lang = s_weekday_lang;
  cc.temp_unit_f = s_temp_unit_f;
  cc.bg_timeout_min = s_bg_timeout_min;
  cc.bg_low = s_bg_low;
  cc.bg_high = s_bg_high;
  cc.col_low_hex = s_col_low_hex;
  cc.col_high_hex = s_col_high_hex;
  cc.col_in_hex = s_col_in_hex;
  persist_write_data(PERSIST_CONFIG_KEY, &cc, sizeof(cc));
}

static void load_config_cache(void) {
  if (!persist_exists(PERSIST_CONFIG_KEY)) { init_defaults(); return; }
  ConfigCache cc;
  if (persist_read_data(PERSIST_CONFIG_KEY, &cc, sizeof(cc)) != (int)sizeof(cc)) { init_defaults(); return; }
  if (cc.version != 1) { init_defaults(); return; }
  for (int i=0;i<ROWS;i++) { s_row_types[i] = cc.row_types[i]; s_row_color_hex[i] = cc.row_color_hex[i]; s_row_colors[i] = ColorFromHex(s_row_color_hex[i]); }
  s_ghost_hex = cc.ghost_hex; s_ghost_color = ColorFromHex(s_ghost_hex);
  s_show_leading_zero = cc.show_leading_zero != 0;
  s_date_format = cc.date_format;
  s_weekday_lang = cc.weekday_lang;
  s_temp_unit_f = cc.temp_unit_f;
  s_bg_timeout_min = cc.bg_timeout_min;
  s_bg_low = cc.bg_low;
  s_bg_high = cc.bg_high;
  s_col_low_hex = cc.col_low_hex; s_col_low = ColorFromHex(s_col_low_hex);
  s_col_high_hex = cc.col_high_hex; s_col_high = ColorFromHex(s_col_high_hex);
  s_col_in_hex = cc.col_in_hex; s_col_in = ColorFromHex(s_col_in_hex);
}

// Draw compact trend arrows without relying on glyphs; use simple triangles/lines
static void trend_update_proc(Layer *layer, GContext *ctx) {
  // Determine what to draw from s_bg_trend string; support '↑↑', '↑', '↗', '→', '↘', '↓', '↓↓' and ASCII fallbacks '^^','^','/>','-','\\>','v','vv'
  const char *t = s_bg_trend;
  GRect b = layer_get_bounds(layer);
  graphics_context_set_stroke_color(ctx, s_bg_trend_color);
  graphics_context_set_fill_color(ctx, s_bg_trend_color);
  graphics_context_set_stroke_width(ctx, 2);
  // Normalize to simple keywords
  bool dbl_up=false, up=false, diag_up=false, flat=false, diag_down=false, down=false, dbl_down=false;
  if (t) {
    if (strstr(t, "↑↑")||strstr(t,"^^")) dbl_up=true;
    else if (strstr(t, "↓↓")||strstr(t,"vv")) dbl_down=true;
    else if (strstr(t, "↑")||strstr(t,"^")) up=true;
    else if (strstr(t, "↓")||strstr(t,"v")) down=true;
    else if (strstr(t, "↗")||strstr(t, "/>")||strstr(t, "/>")) diag_up=true;
    else if (strstr(t, "↘")||strstr(t, "\\>")) diag_down=true;
    else flat=true;
  }
  if (!t || t[0]==0) flat = true;

  // Draw center arrow(s)
  int cx = b.origin.x + b.size.w/2;
  int cy = b.origin.y + b.size.h/2;
  int len = b.size.h/3;
  // helpers
  GPoint upA = GPoint(cx, cy+len/2), upB = GPoint(cx, cy-len/2);
  GPoint upL = GPoint(cx-4, cy-len/2+6), upR = GPoint(cx+4, cy-len/2+6);
  GPoint dnA = GPoint(cx, cy-len/2), dnB = GPoint(cx, cy+len/2);
  GPoint dnL = GPoint(cx-4, cy+len/2-6), dnR = GPoint(cx+4, cy+len/2-6);
  if (flat) {
    graphics_draw_line(ctx, GPoint(b.origin.x+4, cy), GPoint(b.origin.x+b.size.w-4, cy));
    return;
  }
  if (up||dbl_up) {
    graphics_draw_line(ctx, upA, upB);
    graphics_draw_line(ctx, upB, upL);
    graphics_draw_line(ctx, upB, upR);
    if (dbl_up) {
      int off = 8;
      GPoint a = GPoint(upA.x+off, upA.y);
      GPoint b2= GPoint(upB.x+off, upB.y);
      GPoint l = GPoint(upL.x+off, upL.y);
      GPoint r = GPoint(upR.x+off, upR.y);
      graphics_draw_line(ctx, a, b2);
      graphics_draw_line(ctx, b2, l);
      graphics_draw_line(ctx, b2, r);
    }
    return;
  }
  if (down||dbl_down) {
    graphics_draw_line(ctx, dnA, dnB);
    graphics_draw_line(ctx, dnB, dnL);
    graphics_draw_line(ctx, dnB, dnR);
    if (dbl_down) {
      int off = 8;
      GPoint a = GPoint(dnA.x+off, dnA.y);
      GPoint b2= GPoint(dnB.x+off, dnB.y);
      GPoint l = GPoint(dnL.x+off, dnL.y);
      GPoint r = GPoint(dnR.x+off, dnR.y);
      graphics_draw_line(ctx, a, b2);
      graphics_draw_line(ctx, b2, l);
      graphics_draw_line(ctx, b2, r);
    }
    return;
  }
  if (diag_up) {
    GPoint a = GPoint(cx-len/2, cy+len/2);
    GPoint b3= GPoint(cx+len/2, cy-len/2);
    graphics_draw_line(ctx, a, b3);
    graphics_draw_line(ctx, b3, GPoint(b3.x-6, b3.y+2));
    graphics_draw_line(ctx, b3, GPoint(b3.x-2, b3.y+6));
    return;
  }
  if (diag_down) {
    GPoint a = GPoint(cx-len/2, cy-len/2);
    GPoint b3= GPoint(cx+len/2, cy+len/2);
    graphics_draw_line(ctx, a, b3);
    graphics_draw_line(ctx, b3, GPoint(b3.x-6, b3.y-2));
    graphics_draw_line(ctx, b3, GPoint(b3.x-2, b3.y-6));
    return;
  }
}

static void weather_deg_update_proc(Layer *layer, GContext *ctx) {
  graphics_context_set_fill_color(ctx, s_weather_deg_color);
  GRect b = layer_get_bounds(layer);
  GPoint c = GPoint(b.origin.x + b.size.w/2, b.origin.y + b.size.h/2);
  // small filled circle to simulate degree symbol
  graphics_fill_circle(ctx, c, 3);
}
