// pebble-cgm – watch side of the shared CGM logic (MIT, github.com/sgitaize/pebble-cgm)
#include "cgm.h"

#define CGM_LAST_VERSION 1

void cgm_last_save(uint32_t persist_key, const CgmLast *last) {
  if (!last || last->sgv <= 0 || last->ts <= 0) return;
  CgmLast copy = *last;
  copy.version = CGM_LAST_VERSION;
  CgmLast old;
  if (persist_exists(persist_key) &&
      persist_read_data(persist_key, &old, sizeof(old)) == (int)sizeof(old) &&
      memcmp(&old, &copy, sizeof(copy)) == 0) {
    return;   // unchanged: save flash writes
  }
  persist_write_data(persist_key, &copy, sizeof(copy));
}

bool cgm_last_load(uint32_t persist_key, CgmLast *last, int max_age_s) {
  if (!last || !persist_exists(persist_key) ||
      persist_read_data(persist_key, last, sizeof(*last)) != (int)sizeof(*last) ||
      last->version != CGM_LAST_VERSION || last->sgv <= 0) {
    return false;
  }
  if (time(NULL) - (time_t)last->ts > max_age_s) return false;
  last->value[sizeof(last->value) - 1] = '\0';
  last->delta_text[sizeof(last->delta_text) - 1] = '\0';
  last->trend[sizeof(last->trend) - 1] = '\0';
  return true;
}

// ── Wake timer ───────────────────────────────────────────────────────────────
static void (*s_request)(void) = NULL;
static time_t s_next = 0;
static int s_interval = 0;
static int s_tries = 0;
static AppTimer *s_timer = NULL;

static void wake_schedule(void);

static void wake_fire(void *data) {
  s_timer = NULL;
  if (s_request) s_request();
  if (++s_tries < 3) {
    s_timer = app_timer_register(8000, wake_fire, NULL);
    return;
  }
  s_tries = 0;
  s_next += s_interval;   // next expected wake, until the phone sends a new schedule
  wake_schedule();
}

static void wake_schedule(void) {
  if (s_timer) { app_timer_cancel(s_timer); s_timer = NULL; }
  if (s_next <= 0 || s_interval < 60) return;
  time_t now = time(NULL);
  while (s_next + 30 < now) s_next += s_interval;
  int ms = (int)(s_next - now + 3) * 1000;
  if (ms < 500) ms = 500;
  s_tries = 0;
  s_timer = app_timer_register((uint32_t)ms, wake_fire, NULL);
}

void cgm_wake_init(void (*request_fetch)(void)) { s_request = request_fetch; }

void cgm_wake_handle_inbox(DictionaryIterator *iter, uint32_t key_next, uint32_t key_interval) {
  Tuple *t = dict_find(iter, key_next);
  if (!t) return;
  s_next = (time_t)t->value->int32;
  if ((t = dict_find(iter, key_interval))) s_interval = (int)t->value->int32;
  wake_schedule();
}

void cgm_wake_deinit(void) {
  if (s_timer) { app_timer_cancel(s_timer); s_timer = NULL; }
}

// ── Cloud icon ───────────────────────────────────────────────────────────────
void cgm_draw_cloud(GContext *ctx, GPoint c, GColor color) {
  graphics_context_set_fill_color(ctx, color);
  graphics_fill_circle(ctx, GPoint(c.x - 3, c.y + 1), 2);
  graphics_fill_circle(ctx, GPoint(c.x, c.y - 1), 3);
  graphics_fill_circle(ctx, GPoint(c.x + 3, c.y + 1), 2);
  graphics_fill_rect(ctx, GRect(c.x - 4, c.y + 1, 9, 3), 1, GCornersAll);
}
