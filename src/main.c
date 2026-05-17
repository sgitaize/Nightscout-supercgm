#include <pebble.h>

#if defined(PBL_PLATFORM_GABBRO)
#define ROWS 5
#elif defined(PBL_ROUND)
#define ROWS 4
#else
#define ROWS 5
#endif

typedef enum {
  ROW_TYPE_WEATHER = 0,
  ROW_TYPE_TIME = 1,
  ROW_TYPE_DATE = 2,
  ROW_TYPE_WEEKDAY = 3,
  ROW_TYPE_BATTERY = 4,
  ROW_TYPE_BG = 5,
  ROW_TYPE_STEPS = 6,
  ROW_TYPE_HEART_RATE = 7,
  ROW_TYPE_BG_TIMESTAMP = 8,  /* time of last BG reading */
  ROW_TYPE_BG_DELTA = 9,      /* BG delta from Nightscout (can be +/-) */
  ROW_TYPE_WEATHER_RAIN3H = 10 /* rain probability for next 3h */
} RowType;

typedef enum {
  BG_STATUS_OK      = 0,  /* valid reading                          */
  BG_STATUS_NO_DATA = 1,  /* server responded, nothing parseable    */
  BG_STATUS_NO_CONN = 2,  /* network / phone unreachable            */
  BG_STATUS_OLD     = 3   /* JS confirmed reading is stale          */
} BgStatus;

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
static GFont s_font_dseg_30;
static GFont s_font_dseg_30_reg;
static GFont s_font_dseg_34;
static GFont s_font_dseg_34_reg;
#if defined(PBL_ROUND)
static GFont s_font_dseg_25;
static GFont s_font_dseg_25_reg;
static GFont s_font_dseg_29;
static GFont s_font_dseg_29_reg;
#endif
/* Shake overlay layers */
static AppTimer  *s_shake_timer = NULL;
static bool s_shake_active = false;
static GColor s_row_colors[ROWS];
static GColor s_ghost_color;
static RowType s_row_types[ROWS];
static int8_t s_shake_row_types[ROWS];
static bool s_show_ghost_grid = true;
static int s_ghost_density = 3; // 1=sparsest ... 5=densest
static bool s_show_leading_zero = true;
static int s_date_format = 0; // 0: dd/mm, 1: mm/dd
static int s_weekday_lang = 1; // 0: de, 1: en
static int s_temp_unit_f = 0; // 0=C, 1=F
static char s_weather_buf[12];
static char s_bg_trend[8];
static int s_bg_unit_mmol = 0; // 0 mg/dL, 1 mmol

static int s_bg_sgv = -1;
static int s_bg_delta = -9999;
static BgStatus s_bg_status = BG_STATUS_NO_CONN;
static time_t s_bg_timestamp = 0;
static int s_bg_timeout_min = 20;
static int s_bg_fetch_interval_min = 5;
static int s_bg_low = 80;
static int s_bg_high = 180;
/* Alerts & behaviour */
static bool s_vibe_on_low         = false;
static bool s_vibe_on_high        = false;
static bool s_backlight_on_shake  = true;
static time_t s_last_vibe_low_ts  = 0; // cooldown: don't re-vibe within 10 min
static time_t s_last_vibe_high_ts = 0;
static GColor s_col_low, s_col_high, s_col_in;
static uint32_t s_row_color_hex[ROWS];
static uint32_t s_col_low_hex, s_col_high_hex, s_col_in_hex, s_ghost_hex;
static int s_hr_bpm = -1;
static time_t s_hr_timestamp = 0;
static int s_weather_rain3h = -1;

static GColor ColorFromHex(uint32_t hex) {
#if defined(PBL_COLOR)
  uint8_t r = (hex >> 16) & 0xFF;
  uint8_t g = (hex >> 8) & 0xFF;
  uint8_t b = (hex) & 0xFF;
  return GColorFromRGB(r, g, b);
#elif defined(PBL_PLATFORM_DIORITE)
  // Pebble 2 supports 4-level grayscale: quantize to the closest light gray while avoiding pure black
  uint8_t r = (hex >> 16) & 0xFF;
  uint8_t g = (hex >> 8) & 0xFF;
  uint8_t b = (hex) & 0xFF;
  uint8_t lum = (uint8_t)((r * 3 + g * 6 + b) / 10);
  // Snap to 0, 85, 170, 255 but keep at least 85 so text stays visible on black background
  uint8_t level = (lum + 21) / 64; // 0..4-ish
  if (level < 1) level = 1;
  if (level > 3) level = 3;
  uint8_t grey = (uint8_t)(level * 85);
  return GColorFromRGB(grey, grey, grey);
#else
  // Aplite (Pebble Classic) is strictly B/W – always return white for foreground elements
  return GColorWhite;
#endif
}

static GColor GhostColorFromHex(uint32_t hex) {
#if defined(PBL_PLATFORM_DIORITE)
  uint8_t r = (hex >> 16) & 0xFF;
  uint8_t g = (hex >> 8) & 0xFF;
  uint8_t b = (hex) & 0xFF;
  uint8_t lum = (uint8_t)((r * 3 + g * 6 + b) / 10);
  uint8_t level = (uint8_t)((lum + 42) / 85);
  if (level > 3) level = 3;
  uint8_t grey = (uint8_t)(level * 85);
  return GColorFromRGB(grey, grey, grey);
#elif defined(PBL_PLATFORM_APLITE)
  return GColorWhite;
#else
  return ColorFromHex(hex);
#endif
}

static void update_time(void);
static void request_weather(void);
static void draw_all_rows(void);
static void trend_update_proc(Layer *layer, GContext *ctx);
static void weather_deg_update_proc(Layer *layer, GContext *ctx);
static void update_heart_rate(void);
static GRect get_layout_bounds(void);
static void main_window_appear(Window *window);
static void app_focus_handler(bool in_focus);
static void force_redraw_layers(void);

static bool is_large_display(void) {
  GRect bounds = get_layout_bounds();
  return (bounds.size.w >= 200 || bounds.size.h >= 220);
}

static GFont choose_digit_font_for_row(int row) {
  bool large = is_large_display();
#if defined(PBL_ROUND)
  if (row == 0 || row == ROWS - 1) {
    if (large && s_font_dseg_30) return s_font_dseg_30;
    if (s_font_dseg_25) return s_font_dseg_25;
    return s_font_dseg_30;
  }
#endif
  if (large && s_font_dseg_34) return s_font_dseg_34;
#if defined(PBL_ROUND)
  if (s_font_dseg_29) return s_font_dseg_29;
#endif
  return s_font_dseg_30;
}

static GFont choose_ghost_font_for_row(int row) {
  bool large = is_large_display();
#if defined(PBL_ROUND)
  if (row == 0 || row == ROWS - 1) {
    if (large && s_font_dseg_30_reg) return s_font_dseg_30_reg;
    if (s_font_dseg_25_reg) return s_font_dseg_25_reg;
    return s_font_dseg_30_reg;
  }
#endif
  if (large && s_font_dseg_34_reg) return s_font_dseg_34_reg;
#if defined(PBL_ROUND)
  if (s_font_dseg_29_reg) return s_font_dseg_29_reg;
#endif
  return s_font_dseg_30_reg;
}

#ifdef _PBL_API_EXISTS_unobstructed_area_service_subscribe
static void unobstructed_change(AnimationProgress progress, void *context);
static void unobstructed_did_change(void *context);
#endif

static void update_heart_rate(void) {
#if defined(PBL_HEALTH)
  time_t now = time(NULL);
  time_t start = now - 60;
  HealthServiceAccessibilityMask mask = health_service_metric_accessible(HealthMetricHeartRateBPM, start, now);
  if (mask & HealthServiceAccessibilityMaskAvailable) {
    HealthValue hr = health_service_peek_current_value(HealthMetricHeartRateBPM);
    if (hr > 0) {
      s_hr_bpm = (int)hr;
      if (s_hr_bpm > 250) s_hr_bpm = 250;
      s_hr_timestamp = now;
      return;
    }
  }
#endif
  // Leave existing reading intact if still fresh; otherwise mark as unavailable.
  time_t now_fallback = time(NULL);
  if (s_hr_timestamp == 0 || (now_fallback - s_hr_timestamp) > 300) {
    s_hr_bpm = -1;
    s_hr_timestamp = 0;
  }
}

static GRect get_layout_bounds(void) {
  Layer *window_layer = window_get_root_layer(s_main_window);
  return layer_get_bounds(window_layer);
}

// Persisted configuration cache
#define PERSIST_CONFIG_KEY 1002
typedef struct {
  int      version;
  RowType  row_types[ROWS];
  uint32_t row_color_hex[ROWS];
  uint32_t ghost_hex;
  int      show_leading_zero;
  int      date_format;
  int      weekday_lang;
  int      temp_unit_f;
  int      bg_timeout_min;
  int      bg_fetch_interval_min;
  int      bg_low;
  int      bg_high;
  uint32_t col_low_hex;
  uint32_t col_high_hex;
  uint32_t col_in_hex;
  int8_t   shake_row_types[ROWS];
  int      show_ghost_grid;
  int      vibe_on_low;
  int      vibe_on_high;
  int      backlight_on_shake;
} ConfigCache;

static void save_config_cache(void);
static void load_config_cache(void);
static void connection_handler(bool connected);
static void check_bg_alerts(void);

static bool find_hatch_slot(Layer *layer, int *out_row, int *out_col) {
  for (int i = 0; i < ROWS; i++) {
    for (int c = 0; c < 5; c++) {
      if (s_ghost_hatch_layers[i][c] == layer) {
        if (out_row) *out_row = i;
        if (out_col) *out_col = c;
        return true;
      }
    }
  }
  return false;
}

// Draw ghost 7-segment dot skeleton. Density 1 (sparse) to 5 (dense), all platforms.
static void hatch_update_proc(Layer *layer, GContext *ctx) {
  GRect b = layer_get_bounds(layer);
  int row = -1, col = -1;
  if (!find_hatch_slot(layer, &row, &col)) return;
  (void)row;
  (void)col;

  static const int DENSITY_STEP[5] = {8, 6, 4, 3, 2};
  int d = s_ghost_density;
  if (d < 1) d = 1;
  if (d > 5) d = 5;
  int step = DENSITY_STEP[d - 1];

  graphics_context_set_stroke_color(ctx, s_ghost_color);
  graphics_context_set_stroke_width(ctx, 1);

  int16_t x0 = b.origin.x + b.size.w / 5;
  int16_t x1 = b.origin.x + b.size.w - b.size.w / 5 - 1;
  int16_t y0 = b.origin.y + b.size.h / 7;
  int16_t y1 = b.origin.y + b.size.h - b.size.h / 7 - 1;
  int16_t ym = (int16_t)((y0 + y1) / 2);

  for (int16_t x = x0; x <= x1; x += step) {
    graphics_draw_pixel(ctx, GPoint(x, y0));
    graphics_draw_pixel(ctx, GPoint(x, ym));
    graphics_draw_pixel(ctx, GPoint(x, y1));
  }
  for (int16_t y = y0 + step; y <= ym - step; y += step) {
    graphics_draw_pixel(ctx, GPoint(x0, y));
    graphics_draw_pixel(ctx, GPoint(x1, y));
  }
  for (int16_t y = ym + step; y <= y1 - step; y += step) {
    graphics_draw_pixel(ctx, GPoint(x0, y));
    graphics_draw_pixel(ctx, GPoint(x1, y));
  }
}

// Shake mode helpers
static void hide_shake_mode(void *context) {
  (void)context;
  s_shake_timer = NULL;
  s_shake_active = false;
  draw_all_rows();
}

static bool has_shake_overrides(void) {
  for (int i = 0; i < ROWS; i++) {
    if (s_shake_row_types[i] >= 0) {
      return true;
    }
  }
  return false;
}

static void tap_handler(AccelAxisType axis, int32_t direction) {
  (void)axis; (void)direction;
  if (s_backlight_on_shake) light_enable_interaction();
  if (!has_shake_overrides()) return;
  s_shake_active = true;
  if (s_shake_timer) {
    app_timer_cancel(s_shake_timer);
    s_shake_timer = NULL;
  }
  draw_all_rows();
  s_shake_timer = app_timer_register(5000, hide_shake_mode, NULL);
}

static void connection_handler(bool connected) {
  if (!connected) {
    // Phone/BT lost — show NOCON immediately without waiting for JS timeout
    s_bg_status = BG_STATUS_NO_CONN;
    s_bg_sgv    = -1;
    s_bg_trend[0] = 0;
    draw_all_rows();
    vibes_short_pulse(); // single buzz so user notices disconnect
  }
}

// Called each time a new BG value arrives; fires vibration on threshold breach.
static void check_bg_alerts(void) {
  if (s_bg_status != BG_STATUS_OK || s_bg_sgv < 0) return;
  time_t now = time(NULL);
  const int cooldown = 600; // 10-minute vibe cooldown
  if (s_vibe_on_low && s_bg_sgv < s_bg_low) {
    if ((now - s_last_vibe_low_ts) >= cooldown) {
      s_last_vibe_low_ts = now;
      // Three short pulses = urgent low alert
      static const uint32_t segs[] = {200, 100, 200, 100, 200};
      VibePattern pat = { .durations = segs, .num_segments = 5 };
      vibes_enqueue_custom_pattern(pat);
    }
  } else if (s_vibe_on_high && s_bg_sgv > s_bg_high) {
    if ((now - s_last_vibe_high_ts) >= cooldown) {
      s_last_vibe_high_ts = now;
      // Two short pulses = high alert
      static const uint32_t segs2[] = {200, 100, 200};
      VibePattern pat = { .durations = segs2, .num_segments = 3 };
      vibes_enqueue_custom_pattern(pat);
    }
  }
}

// No-op helper removed; per-slot layering handles ghost

static void layout_rows(void) {
  GRect bounds = get_layout_bounds();
  int16_t row_height = bounds.size.h / ROWS;
#if defined(PBL_ROUND)
  // Legacy round is denser; larger round displays should use more of the screen.
#if defined(PBL_PLATFORM_GABBRO)
  row_height = (int16_t)((bounds.size.h / ROWS) * 0.90f);
  int16_t y_offset = (bounds.size.h - (row_height * ROWS)) / 2;
  int16_t gap = 2;
#else
  row_height = (int16_t)((bounds.size.h / ROWS) * 0.66f);
  int16_t y_offset = (bounds.size.h - (row_height * ROWS)) / 2;
  int16_t gap = 5; // extra spacing between rows on round
#endif
#else
  int16_t y_offset = 0;
  int16_t gap = 0;
#endif
  int16_t slot_w = bounds.size.w / 5;
  int16_t left_pad = (bounds.size.w - slot_w * 5) / 2;
  int16_t x_origin = bounds.origin.x;
  int16_t y_origin = bounds.origin.y;
  int bg_index = -1;
  int weather_index = -1;
  for (int i = 0; i < ROWS; i++) {
    for (int c = 0; c < 5; c++) {
  bool hide = false;
#if defined(PBL_ROUND)
  // On round, top/bottom rows show only middle 3 slots (1..3). Hide both outer slots.
  if ((i == 0 || i == ROWS-1) && (c == 0 || c == 4)) hide = true;
#endif
  int16_t y = y_origin + y_offset + i * row_height + i * gap;
  GRect frame = GRect(x_origin + left_pad + c * slot_w, y, slot_w, row_height);
      if (s_ghost_layers[i][c]) {
  // Ghost TextLayer always hidden; hatch layer draws the dots on all platforms.
  bool ghost_hide = true;
  (void)(hide || !s_show_ghost_grid);
  layer_set_hidden(text_layer_get_layer(s_ghost_layers[i][c]), ghost_hide);
#if defined(PBL_ROUND)
  GRect f2 = GRect(frame.origin.x, frame.origin.y, frame.size.w, frame.size.h-1);
  layer_set_frame(text_layer_get_layer(s_ghost_layers[i][c]), f2);
#else
  layer_set_frame(text_layer_get_layer(s_ghost_layers[i][c]), frame);
#endif
      }
      if (s_ghost_hatch_layers[i][c]) {
        layer_set_hidden(s_ghost_hatch_layers[i][c], hide || !s_show_ghost_grid);
        layer_set_frame(s_ghost_hatch_layers[i][c], frame);
      }
      if (s_digit_layers[i][c]) {
  layer_set_hidden(text_layer_get_layer(s_digit_layers[i][c]), hide);
#if defined(PBL_ROUND)
  GRect f2 = GRect(frame.origin.x, frame.origin.y, frame.size.w, frame.size.h-1);
  layer_set_frame(text_layer_get_layer(s_digit_layers[i][c]), f2);
#else
  layer_set_frame(text_layer_get_layer(s_digit_layers[i][c]), frame);
#endif
      }
    }
    if (s_row_types[i] == ROW_TYPE_BG) bg_index = i;
    if (s_row_types[i] == ROW_TYPE_WEATHER) weather_index = i;
  }
  if (s_bg_trend_layer) {
    if (bg_index < 0) {
      layer_set_hidden(s_bg_trend_layer, true);
    }
    // draw_all_rows() is authoritative for showing/hiding based on BG status
  }
  if (s_weather_deg_layer) {
    if (weather_index >= 0) {
      // will be positioned precisely in draw_all_rows
    int16_t y = y_origin + y_offset + weather_index * row_height + weather_index * gap;
  GRect frame = GRect(x_origin + left_pad + slot_w * 4, y, slot_w, row_height);
  // Keep hidden on round (no degree dot there); rectangular will manage visibility in draw_all_rows
#if defined(PBL_ROUND)
  layer_set_hidden(s_weather_deg_layer, true);
#else
  layer_set_hidden(s_weather_deg_layer, false);
#endif
      layer_set_frame(s_weather_deg_layer, frame);
    } else {
      layer_set_hidden(s_weather_deg_layer, true);
    }
  }
}

static void battery_handler(BatteryChargeState state) { draw_all_rows(); }

static void health_handler(HealthEventType event, void *context) {
  if (event == HealthEventMovementUpdate) {
    draw_all_rows();
  }
#if defined(PBL_HEALTH)
  if (event == HealthEventHeartRateUpdate) {
    update_heart_rate();
    draw_all_rows();
  }
#endif
}

#ifdef _PBL_API_EXISTS_unobstructed_area_service_subscribe
static void unobstructed_change(AnimationProgress progress, void *context) {
  layout_rows();
  draw_all_rows();
}

static void unobstructed_did_change(void *context) {
  layout_rows();
  draw_all_rows();
}
#endif

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
  update_heart_rate();

  // BG line
  static char s_bg[16];
  {
    int stale_sec = s_bg_fetch_interval_min * 2 * 60;
    if (stale_sec < 300) stale_sec = 300;
    int age_sec = (int)(now - s_bg_timestamp);
    if (s_bg_status == BG_STATUS_NO_CONN) {
      snprintf(s_bg, sizeof(s_bg), "NOCON");
    } else if (s_bg_status == BG_STATUS_NO_DATA || s_bg_sgv < 0) {
      snprintf(s_bg, sizeof(s_bg), "NO-BG");
    } else if (s_bg_status == BG_STATUS_OLD || age_sec > stale_sec) {
      snprintf(s_bg, sizeof(s_bg), "OLDBG");
    } else {
      if (s_bg_unit_mmol) {
        int mmol10 = (s_bg_sgv * 10) / 18;
        snprintf(s_bg, sizeof(s_bg), "%d.%d", mmol10 / 10, mmol10 % 10);
      } else {
        snprintf(s_bg, sizeof(s_bg), "%d", s_bg_sgv);
      }
    }
  }

  // Battery
  static char s_batt[6];
  snprintf(s_batt, sizeof(s_batt), "%3d%%", batt_state.charge_percent);

  // Steps
  static char s_steps[8];
  snprintf(s_steps, sizeof(s_steps), "%5ld", (long)steps_now);

  // Heart rate
  static char s_hr[6];
  bool hr_fresh = (s_hr_bpm > 0 && s_hr_timestamp != 0 && (now - s_hr_timestamp) <= 300);
  if (hr_fresh) {
    int hr_disp = s_hr_bpm;
    if (hr_disp < 0) hr_disp = 0;
    if (hr_disp > 999) hr_disp = 999;
    s_hr[0] = 'H';
    s_hr[1] = 'R';
    s_hr[2] = (char)('0' + ((hr_disp / 100) % 10));
    s_hr[3] = (char)('0' + ((hr_disp / 10) % 10));
    s_hr[4] = (char)('0' + (hr_disp % 10));
    s_hr[5] = '\0';
  } else {
    snprintf(s_hr, sizeof(s_hr), "HR --");
  }

  // Assign texts and colors per row into 5 slots
  // Hide degree overlay once before the loop; only the weather case will re-enable it.
#if !defined(PBL_ROUND)
  if (s_weather_deg_layer) {
    layer_set_hidden(s_weather_deg_layer, true);
  }
#endif

  for (int i = 0; i < ROWS; i++) {
    GColor color = s_row_colors[i];
#if defined(PBL_PLATFORM_APLITE)
    // Force white digits on Pebble Classic so text is visible on black background
    color = GColorWhite;
#endif
    // Build a 5-char buffer for this row
    char slots[6] = {' ', ' ', ' ', ' ', ' ', 0};

    RowType row_type = s_row_types[i];
    if (s_shake_active && s_shake_row_types[i] >= 0) {
      row_type = (RowType)s_shake_row_types[i];
      // BG row overridden by shake: hide trend arrow so it doesn't linger
      if (s_row_types[i] == ROW_TYPE_BG && row_type != ROW_TYPE_BG && s_bg_trend_layer) {
        layer_set_hidden(s_bg_trend_layer, true);
      }
    }

  switch (row_type) {
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
#if defined(PBL_COLOR)
        if (batt_state.charge_percent <= 10) {
          color = GColorRed;
        }
#endif
        {
          // right-align within 5 slots
          size_t bl = strlen(s_batt); if (bl > 5) bl = 5;
          int bstart = (int)(5 - bl);
          for (size_t k=0;k<bl;k++) slots[bstart + k] = s_batt[k];
        }
        break;
  case ROW_TYPE_BG: {
        // Color by thresholds, grey on error
        if (s_bg_status == BG_STATUS_OK && s_bg_sgv >= 0) {
          int stale_sec = s_bg_fetch_interval_min * 2 * 60;
          if (stale_sec < 300) stale_sec = 300;
          if ((int)(now - s_bg_timestamp) > stale_sec) {
            color = GColorLightGray;
          } else if (s_bg_sgv < s_bg_low) color = s_col_low;
          else if (s_bg_sgv > s_bg_high) color = s_col_high;
          else color = s_col_in;
        } else if (s_bg_status == BG_STATUS_NO_CONN || s_bg_status == BG_STATUS_NO_DATA
                   || s_bg_status == BG_STATUS_OLD) {
#if defined(PBL_COLOR)
          color = GColorLightGray;
#endif
        }
        // Center s_bg; on round top/bottom we use slots 1..4 (four digits)
        size_t l = strlen(s_bg);
#if defined(PBL_ROUND)
        if (i == 0 || i == ROWS-1) {
          if (l > 3) l = 3;
          int start = 1 + (3 - (int)l) / 2; // center within slots 1..3
          for (size_t k=0;k<l;k++) slots[start + k] = s_bg[k];
        } else {
          if (l > 5) l = 5;
          int start = (5 - (int)l) / 2;
          for (size_t k=0;k<l;k++) slots[start + k] = s_bg[k];
        }
#else
        if (l > 5) l = 5;
        int start = (5 - (int)l) / 2;
        for (size_t k=0;k<l;k++) slots[start + k] = s_bg[k];
#endif
        // trend overlay
        if (s_bg_trend_layer && s_bg_status == BG_STATUS_OK && s_bg_sgv >= 0) {
          s_bg_trend_color = color;
          // position overlay near the right
          GRect bounds = get_layout_bounds();
          int16_t row_h = bounds.size.h / ROWS;
          int16_t y_off = 0;
          int16_t gap = 0;
#if defined(PBL_ROUND)
          // Mirror layout_rows() exactly so overlay stays aligned with digit layers
#if defined(PBL_PLATFORM_GABBRO)
          row_h = (int16_t)((bounds.size.h / ROWS) * 0.90f);
          y_off = (bounds.size.h - (row_h * ROWS)) / 2;
          gap = 2;
#else
          row_h = (int16_t)((bounds.size.h / ROWS) * 0.66f);
          y_off = (bounds.size.h - (row_h * ROWS)) / 2;
          gap = 5;
#endif
#endif
          int16_t slot_w = bounds.size.w / 5;
          int16_t left_pad = (bounds.size.w - slot_w * 5) / 2;
          int16_t x_origin = bounds.origin.x;
          int16_t y_origin = bounds.origin.y;
          int slot_index = 4;
          int16_t y_base = y_origin + y_off + i * row_h + i * gap;
          int16_t frame_h = (gap > 0) ? row_h - gap : row_h;
          GRect frame = GRect(x_origin + left_pad + slot_index * slot_w, y_base, slot_w, frame_h);
          layer_set_frame(s_bg_trend_layer, frame);
          layer_set_hidden(s_bg_trend_layer, false);
          layer_mark_dirty(s_bg_trend_layer);
        } else if (s_bg_trend_layer) {
          layer_set_hidden(s_bg_trend_layer, true);
        }
        break;
      }
  case ROW_TYPE_WEATHER: {
        // Ensure default and fit into grid; parse degree/unit and place into slots
        if (strlen(s_weather_buf) == 0) {
          snprintf(s_weather_buf, sizeof(s_weather_buf), "--");
        }
        // build temp without '°' to get numeric; keep unit as letter
        char temp_no_deg[8]; size_t p = 0;
        for (size_t q = 0; q < strlen(s_weather_buf) && p < sizeof(temp_no_deg)-1; q++) {
          // UTF-8 degree sign is 0xC2 0xB0 – skip both bytes safely
          if ((unsigned char)s_weather_buf[q] == 0xC2
              && q + 1 < sizeof(s_weather_buf)
              && (unsigned char)s_weather_buf[q+1] == 0xB0) { q++; continue; }
          if ((unsigned char)s_weather_buf[q] == 0xB0) { continue; }
          temp_no_deg[p++] = s_weather_buf[q];
        }
        temp_no_deg[p] = 0;
        // Identify trailing unit (C/F) and separate it
        size_t l2 = strlen(temp_no_deg);
        char unit_char = 0;
        if (l2 > 0 && (temp_no_deg[l2-1] == 'C' || temp_no_deg[l2-1] == 'F')) {
          unit_char = temp_no_deg[l2-1];
          temp_no_deg[l2-1] = 0; // remove unit from numeric string
          l2--;
        }
        // Place into slots based on platform; draw degree via overlay circle
        if (s_weather_deg_layer) layer_set_hidden(s_weather_deg_layer, true);

        // Rectangular: numeric in slots 0..2, unit in slot 4; degree drawn in slot 3 via overlay
#if !defined(PBL_ROUND)
    if (l2 > 3) l2 = 3;
    int start_col = 3 - (int)l2;
    if (start_col < 0) start_col = 0;
    for (size_t k = 0; k < l2 && (start_col + (int)k) < 3; k++) {
          slots[start_col + k] = temp_no_deg[k];
        }
        slots[3] = ' '; // degree slot kept blank; overlay will draw dot
    slots[4] = ' ';
        if (unit_char == 'C' || unit_char == 'F') { slots[4] = unit_char; }
#else
        // Round: only 3 visible slots (1..3). Prefer including unit; include degree only if it fits.
        if (i == 0 || i == ROWS-1) {
          if (l2 <= 1) {
            // digit, degree, unit
            slots[1] = temp_no_deg[0];
            if (unit_char) { slots[3] = unit_char; }
          } else {
            // two digits plus unit (omit degree to fit)
            slots[1] = temp_no_deg[0];
            slots[2] = temp_no_deg[1];
            if (unit_char) slots[3] = unit_char;
          }
        } else {
          // middle rows have full 5 slots; mirror rectangular layout but center a bit
          if (l2 > 3) l2 = 3;
          int start = 1; // leave a small left pad
          for (size_t k=0; k<l2 && (start+k)<5; k++) slots[start+k] = temp_no_deg[k];
          if (unit_char) { slots[4] = unit_char; }
        }
#endif
  // Position and show degree overlay (small circle) only on rectangular screens.
#if !defined(PBL_ROUND)
  if (s_weather_deg_layer) {
    GRect bounds = get_layout_bounds();
    int16_t row_h = bounds.size.h / ROWS;
    int16_t slot_w = bounds.size.w / 5;
    int16_t left_pad = (bounds.size.w - slot_w * 5) / 2;
    int deg_slot = 3; // slot before/with unit
    int16_t y_base = bounds.origin.y + i * row_h;
    GRect frame = GRect(bounds.origin.x + left_pad + deg_slot * slot_w, y_base, slot_w, row_h);
    s_weather_deg_color = color;
    layer_set_frame(s_weather_deg_layer, frame);
    layer_set_hidden(s_weather_deg_layer, false);
    layer_mark_dirty(s_weather_deg_layer);
  }
#endif
        break;
      }
      case ROW_TYPE_STEPS:
        strncpy(slots, s_steps, 5);
        break;
      case ROW_TYPE_HEART_RATE:
        strncpy(slots, s_hr, 5);
        break;
      case ROW_TYPE_BG_TIMESTAMP: {
        if (s_bg_timestamp > 0) {
          struct tm *lt = localtime(&s_bg_timestamp);
          char ts[6];
          snprintf(ts, sizeof(ts), "%02d:%02d", lt->tm_hour, lt->tm_min);
          for (int k = 0; k < 5; k++) slots[k] = ts[k];
        } else {
          slots[0] = '-';
          slots[1] = '-';
          slots[2] = ':';
          slots[3] = '-';
          slots[4] = '-';
        }
        break;
      }
      case ROW_TYPE_BG_DELTA: {
        char d[8];
        if (s_bg_status == BG_STATUS_OK && s_bg_delta != -9999) {
          if (s_bg_delta > 0) {
            snprintf(d, sizeof(d), "+%d", s_bg_delta);
          } else if (s_bg_delta < 0) {
            snprintf(d, sizeof(d), "%d", s_bg_delta);
          } else {
            d[0] = 0; // delta == 0: show nothing
          }
        } else {
          snprintf(d, sizeof(d), "--");
        }
        size_t dl = strlen(d);
        if (dl > 5) dl = 5;
        int dstart = (5 - (int)dl) / 2;
        for (size_t k = 0; k < dl; k++) slots[dstart + (int)k] = d[k];
        break;
      }
      case ROW_TYPE_WEATHER_RAIN3H: {
        char r[8];
        if (s_weather_rain3h >= 0) {
          if (s_weather_rain3h > 100) s_weather_rain3h = 100;
          snprintf(r, sizeof(r), "R%2d%%", s_weather_rain3h);
        } else {
          snprintf(r, sizeof(r), "R--%%" );
        }
        size_t rl = strlen(r);
        if (rl > 5) rl = 5;
        int rstart = (5 - (int)rl) / 2;
        for (size_t k = 0; k < rl; k++) slots[rstart + (int)k] = r[k];
        break;
      }
    }

    // Apply to slots and set fonts/colors
    for (int c = 0; c < 5; c++) {
      // Prepare persistent buffer for this slot
      s_slot_text[i][c][0] = slots[c];
      s_slot_text[i][c][1] = 0;
      if (s_ghost_hatch_layers[i][c]) layer_mark_dirty(s_ghost_hatch_layers[i][c]);
      // Ghost always "8"
      if (s_ghost_layers[i][c]) {
        text_layer_set_text(s_ghost_layers[i][c], "8");
        text_layer_set_text_color(s_ghost_layers[i][c], s_ghost_color);
        GFont gf = choose_ghost_font_for_row(i);
        if (gf) text_layer_set_font(s_ghost_layers[i][c], gf);
      }
      if (s_digit_layers[i][c]) {
        text_layer_set_text(s_digit_layers[i][c], s_slot_text[i][c]);
  // Apply per-row color so digits are not black
  text_layer_set_text_color(s_digit_layers[i][c], color);
  // Keep transparent background so ghost '8' shows except where glyph pixels render
  text_layer_set_background_color(s_digit_layers[i][c], GColorClear);
  GFont df = choose_digit_font_for_row(i);
  if (df) text_layer_set_font(s_digit_layers[i][c], df);
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
  bool config_changed = false;

  if ((t = dict_find(iter, MESSAGE_KEY_WEATHER_TEMP))) {
    // Put temp with unit symbol in any weather row
    char symbol = s_temp_unit_f ? 'F' : 'C';
    snprintf(s_weather_buf, sizeof(s_weather_buf), "%ld°%c", t->value->int32, symbol);
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
  }
  if ((t = dict_find(iter, MESSAGE_KEY_BG_TIMESTAMP))) {
    s_bg_timestamp = (time_t)t->value->int32;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_BG_STATUS))) {
    s_bg_status = (BgStatus)t->value->int32;
    // For NO_DATA and NO_CONN there is no valid reading — clear sgv and trend.
    // For BG_STATUS_OLD the SGV value is still valid (just stale), so keep it.
    if (s_bg_status == BG_STATUS_NO_DATA || s_bg_status == BG_STATUS_NO_CONN) {
      s_bg_sgv = -1;
      s_bg_delta = -9999;
      s_bg_trend[0] = 0;
    }
  }
  if ((t = dict_find(iter, MESSAGE_KEY_BG_UNIT))) {
    s_bg_unit_mmol = t->value->int32 ? 1 : 0;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_BG_TREND))) {
    strncpy(s_bg_trend, t->value->cstring, sizeof(s_bg_trend));
    s_bg_trend[sizeof(s_bg_trend)-1] = 0;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_BG_DELTA))) {
    s_bg_delta = (int)t->value->int32;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_WEATHER_RAIN3H))) {
    s_weather_rain3h = (int)t->value->int32;
  }
  // Fire vibe alert if a new valid BG just arrived
  check_bg_alerts();

  // Config
  if ((t = dict_find(iter, MESSAGE_KEY_SHOW_LEADING_ZERO))) {
    s_show_leading_zero = t->value->int32 != 0;
    config_changed = true;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_DATE_FORMAT))) {
    s_date_format = t->value->int32;
    config_changed = true;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_WEEKDAY_LANG))) {
    s_weekday_lang = t->value->int32;
    config_changed = true;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_BG_TIMEOUT_MIN))) {
    s_bg_timeout_min = t->value->int32;
    config_changed = true;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_BG_FETCH_INTERVAL_MIN))) {
    s_bg_fetch_interval_min = t->value->int32;
    if (s_bg_fetch_interval_min < 1) s_bg_fetch_interval_min = 1;
    config_changed = true;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_BG_THRESH_LOW))) {
    s_bg_low = t->value->int32;
    config_changed = true;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_BG_THRESH_HIGH))) {
    s_bg_high = t->value->int32;
    config_changed = true;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_COLOR_LOW))) {
    s_col_low_hex = (uint32_t)t->value->int32; s_col_low = ColorFromHex(s_col_low_hex);
    config_changed = true;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_COLOR_HIGH))) {
    s_col_high_hex = (uint32_t)t->value->int32; s_col_high = ColorFromHex(s_col_high_hex);
    config_changed = true;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_COLOR_IN_RANGE))) {
    s_col_in_hex = (uint32_t)t->value->int32; s_col_in = ColorFromHex(s_col_in_hex);
    config_changed = true;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_GHOST_COLOR))) {
  s_ghost_hex = (uint32_t)t->value->int32;
#if defined(PBL_PLATFORM_APLITE)
  s_ghost_color = GColorWhite;
#else
  {
    uint8_t r = (s_ghost_hex >> 16) & 0xFF;
    uint8_t g = (s_ghost_hex >>  8) & 0xFF;
    uint8_t b =  s_ghost_hex        & 0xFF;
    if (r < 0x55 && g < 0x55 && b < 0x55) { s_ghost_hex = 0x555555; }
  }
  s_ghost_color = GhostColorFromHex(s_ghost_hex);
#endif
  for (int i = 0; i < ROWS; i++) {
    for (int c = 0; c < 5; c++) {
      if (s_ghost_layers[i][c]) text_layer_set_text_color(s_ghost_layers[i][c], s_ghost_color);
      if (s_ghost_hatch_layers[i][c]) layer_mark_dirty(s_ghost_hatch_layers[i][c]);
    }
  }
  config_changed = true;
  }

  if ((t = dict_find(iter, MESSAGE_KEY_GHOST_DENSITY))) {
    s_ghost_density = (int)t->value->int32;
    if (s_ghost_density < 1) s_ghost_density = 1;
    if (s_ghost_density > 5) s_ghost_density = 5;
    for (int i = 0; i < ROWS; i++)
      for (int c = 0; c < 5; c++)
        if (s_ghost_hatch_layers[i][c]) layer_mark_dirty(s_ghost_hatch_layers[i][c]);
    config_changed = true;
  }

  // Row type/color config
  for (int i = 0; i < ROWS; i++) {
    int key_type = MESSAGE_KEY_ROW1_TYPE + i;
    int key_color = MESSAGE_KEY_ROW1_COLOR + i;
    if ((t = dict_find(iter, key_type)))  { s_row_types[i] = (RowType)t->value->int32; config_changed = true; }
    if ((t = dict_find(iter, key_color))) { s_row_color_hex[i] = (uint32_t)t->value->int32; s_row_colors[i] = ColorFromHex(s_row_color_hex[i]); config_changed = true; }
  }

  for (int i = 0; i < ROWS; i++) {
    int key_shake_type = MESSAGE_KEY_SHAKE_ROW1_TYPE + i;
    if ((t = dict_find(iter, key_shake_type))) {
      int v = t->value->int32;
      if (v < -1) v = -1;
      if (v > ROW_TYPE_WEATHER_RAIN3H) v = ROW_TYPE_WEATHER_RAIN3H;
      s_shake_row_types[i] = (int8_t)v;
      config_changed = true;
    }
  }
  if ((t = dict_find(iter, MESSAGE_KEY_SHOW_GHOST_GRID))) {
    s_show_ghost_grid = t->value->int32 != 0;
    layout_rows();
    config_changed = true;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_VIBE_ON_LOW))) {
    s_vibe_on_low = t->value->int32 != 0;
    config_changed = true;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_VIBE_ON_HIGH))) {
    s_vibe_on_high = t->value->int32 != 0;
    config_changed = true;
  }
  if ((t = dict_find(iter, MESSAGE_KEY_BACKLIGHT_ON_SHAKE))) {
    s_backlight_on_shake = t->value->int32 != 0;
    config_changed = true;
  }

  draw_all_rows();

  // Only write to flash when persistent config actually changed
  if (config_changed) save_config_cache();
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

static void main_window_load(Window *window) {
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
#if defined(PBL_PLATFORM_APLITE)
  text_layer_set_text_color(s_ghost_layers[i][c], GColorWhite);
#endif
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

static void main_window_appear(Window *window) {
  layout_rows();
  draw_all_rows();
}

static void app_focus_handler(bool in_focus) {
  if (!in_focus) {
    return;
  }
  layout_rows();
  draw_all_rows();
  force_redraw_layers();
}

static void force_redraw_layers(void) {
  for (int i = 0; i < ROWS; i++) {
    for (int c = 0; c < 5; c++) {
      if (s_ghost_layers[i][c]) {
        layer_mark_dirty(text_layer_get_layer(s_ghost_layers[i][c]));
      }
      if (s_ghost_hatch_layers[i][c]) {
        layer_mark_dirty(s_ghost_hatch_layers[i][c]);
      }
      if (s_digit_layers[i][c]) {
        layer_mark_dirty(text_layer_get_layer(s_digit_layers[i][c]));
      }
    }
  }
  if (s_bg_trend_layer) {
    layer_mark_dirty(s_bg_trend_layer);
  }
  if (s_weather_deg_layer) {
    layer_mark_dirty(s_weather_deg_layer);
  }
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
  // Defaults vary by platform
#if defined(PBL_ROUND)
  // Round: 4 rows -> 1 Weather, 2 Time, 3 Weekday, 4 CGM
  s_row_types[0] = ROW_TYPE_WEATHER;
  s_row_types[1] = ROW_TYPE_TIME;
  s_row_types[2] = ROW_TYPE_WEEKDAY;
  s_row_types[3] = ROW_TYPE_BG;
#else
  // Rectangular: 5 rows -> 1 Weather, 2 Time, 3 Date, 4 Weekday, 5 CGM
  s_row_types[0] = ROW_TYPE_WEATHER;
  s_row_types[1] = ROW_TYPE_TIME;
  s_row_types[2] = ROW_TYPE_DATE;
  s_row_types[3] = ROW_TYPE_WEEKDAY;
  s_row_types[4] = ROW_TYPE_BG;
#endif
  // Default colors (color displays use vivid defaults; BW will map via ColorFromHex)
#if defined(PBL_ROUND)
  s_row_color_hex[0] = 0x00FFFF; // Weather cyan
  s_row_color_hex[1] = 0xFFFFFF; // Time white
  s_row_color_hex[2] = 0xAAAAAA; // Weekday light gray
  s_row_color_hex[3] = 0x00FF00; // CGM default green
#else
  s_row_color_hex[0] = 0x00FFFF; // Weather cyan
  s_row_color_hex[1] = 0xFFFFFF; // Time white
  s_row_color_hex[2] = 0xAAAAAA; // Date light gray
  s_row_color_hex[3] = 0xAAAAAA; // Weekday light gray
  s_row_color_hex[4] = 0x00FF00; // CGM default green (overridden by thresholds if BG present)
#endif
  for (int i=0;i<ROWS;i++) s_row_colors[i] = ColorFromHex(s_row_color_hex[i]);
  // Ghost grid color: dark grey on color displays; force white on BW (hatch overlay makes it appear mid-gray)
  s_ghost_hex = 0x555555; s_ghost_color = GhostColorFromHex(s_ghost_hex);
#if defined(PBL_BW)
  s_ghost_color = GColorWhite; // BW has no gray; hatch overlay creates mid-gray appearance
#endif
  s_col_low_hex = 0xFF0000; s_col_low = ColorFromHex(s_col_low_hex);
  s_col_high_hex = 0xFFFF00; s_col_high = ColorFromHex(s_col_high_hex);
  s_col_in_hex = 0x00FF00; s_col_in = ColorFromHex(s_col_in_hex);
  s_bg_timeout_min = 20;
  s_bg_fetch_interval_min = 5;
  s_bg_delta = -9999;
  s_weather_rain3h = -1;
  s_weekday_lang = 1; // English default
  for (int i=0; i<ROWS; i++) s_shake_row_types[i] = -1;
  s_show_ghost_grid = true;
  s_vibe_on_low        = false;
  s_vibe_on_high       = false;
  s_backlight_on_shake = true;
#if defined(PBL_PLATFORM_DIORITE)
  for (int i=0; i<ROWS; i++) {
    s_row_color_hex[i] = 0xFFFFFF;
    s_row_colors[i] = ColorFromHex(s_row_color_hex[i]);
  }
  // Diorite 4-level grayscale: 0x444444 → lum=68 → level=1 → 85 = DarkGray (subtle, not white, not black)
  s_ghost_hex = 0x444444;
  s_ghost_color = GhostColorFromHex(s_ghost_hex);
  s_col_low_hex = 0xFFFFFF;
  s_col_high_hex = 0xFFFFFF;
  s_col_in_hex = 0xFFFFFF;
  s_col_low = ColorFromHex(s_col_low_hex);
  s_col_high = ColorFromHex(s_col_high_hex);
  s_col_in = ColorFromHex(s_col_in_hex);
#endif
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
  s_font_dseg_34 = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FONT_DSEG_34_BOLD));
  s_font_dseg_34_reg = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FONT_DSEG_34_REG));
  // Smaller variants for round to fit tighter rows
#if defined(PBL_ROUND)
  s_font_dseg_25 = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FONT_DSEG_25_BOLD));
  s_font_dseg_25_reg = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FONT_DSEG_25_REG));
  s_font_dseg_29 = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FONT_DSEG_29_BOLD));
  s_font_dseg_29_reg = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FONT_DSEG_29_REG));
#endif

  s_main_window = window_create();
  window_set_background_color(s_main_window, GColorBlack);
  window_set_window_handlers(s_main_window, (WindowHandlers) {
    .load = main_window_load,
    .appear = main_window_appear,
    .unload = main_window_unload
  });
  window_stack_push(s_main_window, true);

  // Services
  tick_timer_service_subscribe(MINUTE_UNIT, tick_handler);
  battery_state_service_subscribe(battery_handler);
  health_service_events_subscribe(health_handler, NULL);
#ifdef _PBL_API_EXISTS_unobstructed_area_service_subscribe
  unobstructed_area_service_subscribe((UnobstructedAreaHandlers) {
    .change = unobstructed_change,
    .did_change = unobstructed_did_change
  }, NULL);
#endif
  app_focus_service_subscribe(app_focus_handler);
  accel_tap_service_subscribe(tap_handler);
  connection_service_subscribe((ConnectionHandlers) {
    .pebble_app_connection_handler = connection_handler
  });

  // Messaging
  app_message_register_inbox_received(inbox_received_callback);
  app_message_register_inbox_dropped(inbox_dropped_callback);
  app_message_register_outbox_failed(outbox_failed_callback);
  app_message_register_outbox_sent(outbox_sent_callback);
  app_message_open(1024, 256);

  update_heart_rate();
  update_time();
}

static void deinit(void) {
  accel_tap_service_unsubscribe();
  connection_service_unsubscribe();
  if (s_shake_timer) { app_timer_cancel(s_shake_timer); s_shake_timer = NULL; }
  tick_timer_service_unsubscribe();
  battery_state_service_unsubscribe();
  health_service_events_unsubscribe();
#ifdef _PBL_API_EXISTS_unobstructed_area_service_unsubscribe
  unobstructed_area_service_unsubscribe();
#endif
  app_focus_service_unsubscribe();

  fonts_unload_custom_font(s_font_dseg_30);
  if (s_font_dseg_30_reg) fonts_unload_custom_font(s_font_dseg_30_reg);
  if (s_font_dseg_34) fonts_unload_custom_font(s_font_dseg_34);
  if (s_font_dseg_34_reg) fonts_unload_custom_font(s_font_dseg_34_reg);
#if defined(PBL_ROUND)
  if (s_font_dseg_25) fonts_unload_custom_font(s_font_dseg_25);
  if (s_font_dseg_25_reg) fonts_unload_custom_font(s_font_dseg_25_reg);
  if (s_font_dseg_29) fonts_unload_custom_font(s_font_dseg_29);
  if (s_font_dseg_29_reg) fonts_unload_custom_font(s_font_dseg_29_reg);
#endif

  window_destroy(s_main_window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}

static void save_config_cache(void) {
  ConfigCache cc;
  cc.version = 4;
  for (int i=0;i<ROWS;i++) { cc.row_types[i] = s_row_types[i]; cc.row_color_hex[i] = s_row_color_hex[i]; }
  cc.ghost_hex = s_ghost_hex;
  cc.show_leading_zero = s_show_leading_zero ? 1 : 0;
  cc.date_format = s_date_format;
  cc.weekday_lang = s_weekday_lang;
  cc.temp_unit_f = s_temp_unit_f;
  cc.bg_timeout_min = s_bg_timeout_min;
  cc.bg_fetch_interval_min = s_bg_fetch_interval_min;
  cc.bg_low = s_bg_low;
  cc.bg_high = s_bg_high;
  cc.col_low_hex = s_col_low_hex;
  cc.col_high_hex = s_col_high_hex;
  cc.col_in_hex = s_col_in_hex;
  for (int i=0; i<ROWS; i++) cc.shake_row_types[i] = s_shake_row_types[i];
  cc.show_ghost_grid = s_show_ghost_grid ? 1 : 0;
  cc.vibe_on_low        = s_vibe_on_low        ? 1 : 0;
  cc.vibe_on_high       = s_vibe_on_high       ? 1 : 0;
  cc.backlight_on_shake = s_backlight_on_shake ? 1 : 0;
  persist_write_data(PERSIST_CONFIG_KEY, &cc, sizeof(cc));
}

static void load_config_cache(void) {
  if (!persist_exists(PERSIST_CONFIG_KEY)) { init_defaults(); return; }
  ConfigCache cc;
  if (persist_read_data(PERSIST_CONFIG_KEY, &cc, sizeof(cc)) != (int)sizeof(cc)) { init_defaults(); return; }
  if (cc.version != 3 && cc.version != 4) { init_defaults(); return; }
  for (int i=0;i<ROWS;i++) { s_row_types[i] = cc.row_types[i]; s_row_color_hex[i] = cc.row_color_hex[i]; s_row_colors[i] = ColorFromHex(s_row_color_hex[i]); }
  s_ghost_hex = cc.ghost_hex; s_ghost_color = GhostColorFromHex(s_ghost_hex);
#if defined(PBL_COLOR)
  // Clamp too-dark ghost to mid-grey on color for visibility
  {
    uint8_t r = (s_ghost_hex >> 16) & 0xFF;
    uint8_t g = (s_ghost_hex >>  8) & 0xFF;
    uint8_t b =  s_ghost_hex        & 0xFF;
    if (r < 0x55 && g < 0x55 && b < 0x55) { s_ghost_hex = 0x555555; s_ghost_color = GhostColorFromHex(s_ghost_hex); }
  }
#endif
#if defined(PBL_PLATFORM_APLITE)
  s_ghost_color = GColorWhite;
#endif
  s_show_leading_zero = cc.show_leading_zero != 0;
  s_date_format = cc.date_format;
  s_weekday_lang = cc.weekday_lang;
  s_temp_unit_f = cc.temp_unit_f;
  s_bg_timeout_min = cc.bg_timeout_min;
  s_bg_fetch_interval_min = cc.bg_fetch_interval_min;
  if (s_bg_fetch_interval_min < 1) s_bg_fetch_interval_min = 1;
  s_bg_low = cc.bg_low;
  s_bg_high = cc.bg_high;
  s_col_low_hex = cc.col_low_hex; s_col_low = ColorFromHex(s_col_low_hex);
  s_col_high_hex = cc.col_high_hex; s_col_high = ColorFromHex(s_col_high_hex);
  s_col_in_hex = cc.col_in_hex; s_col_in = ColorFromHex(s_col_in_hex);
  for (int i=0; i<ROWS; i++) s_shake_row_types[i] = (cc.version >= 4) ? cc.shake_row_types[i] : -1;
  s_show_ghost_grid = (cc.version >= 4) ? (cc.show_ghost_grid != 0) : true;
  s_vibe_on_low        = (cc.version >= 3) ? (cc.vibe_on_low        != 0) : false;
  s_vibe_on_high       = (cc.version >= 3) ? (cc.vibe_on_high       != 0) : false;
  s_backlight_on_shake = (cc.version >= 3) ? (cc.backlight_on_shake != 0) : true;
#if defined(PBL_PLATFORM_DIORITE)
  for (int i=0; i<ROWS; i++) {
    s_row_color_hex[i] = 0xFFFFFF;
    s_row_colors[i] = ColorFromHex(s_row_color_hex[i]);
  }
  s_ghost_hex = 0x777777;
  s_ghost_color = GhostColorFromHex(s_ghost_hex);
  s_col_low_hex = 0xFFFFFF;
  s_col_high_hex = 0xFFFFFF;
  s_col_in_hex = 0xFFFFFF;
  s_col_low = ColorFromHex(s_col_low_hex);
  s_col_high = ColorFromHex(s_col_high_hex);
  s_col_in = ColorFromHex(s_col_in_hex);
#endif
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
#if defined(PBL_ROUND)
  // No degree dot on round devices
  return;
#endif
  graphics_context_set_fill_color(ctx, s_weather_deg_color);
  GRect b = layer_get_bounds(layer);
  // Draw only the degree dot in this slot
  // degree dot (top-left within slot)
  int r = 4;
  int dx = b.origin.x + 4 + r;
  int dy = b.origin.y + 4 + r;
  graphics_fill_circle(ctx, GPoint(dx, dy), r);
}
