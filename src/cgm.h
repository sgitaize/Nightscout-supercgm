// pebble-cgm – watch side of the shared CGM logic (MIT, github.com/sgitaize/pebble-cgm)
// Copy c/cgm.h and c/cgm.c into src/c/ of your watch face. See docs/integration.md.
#pragma once
#include <pebble.h>

// Status values sent by js/cgm.js through your status message key.
typedef enum {
  CGM_STATUS_OK      = 0,  // valid reading
  CGM_STATUS_NO_DATA = 1,  // server answered, nothing usable
  CGM_STATUS_NO_CONN = 2,  // network / phone unreachable
  CGM_STATUS_OLD     = 3,  // reading is older than two sensor intervals
  CGM_STATUS_NO_APP  = 4,  // iPump-mini unreachable for 15 min: ask the user to open the app
  CGM_STATUS_NO_URL  = 5,  // no data source configured
} CgmStatus;

// Last reading, kept across restarts of the watch face (persist storage).
// Strings are the already formatted display texts of your face; numbers are raw.
typedef struct {
  uint8_t version;
  uint8_t fallback;   // 1 = value came from the Nightscout fallback
  int16_t delta;      // in your display unit (e.g. mg/dL or mmol x10); -9999 = unknown
  int32_t ts;         // reading time (Unix seconds)
  int32_t sgv;        // in your display unit; <= 0 = none
  char value[8];      // e.g. "142" or "7.9"
  char delta_text[8]; // e.g. "+3", "-0.2"
  char trend[8];      // e.g. "^", "->", "vv"
} CgmLast;

// Saves / loads the last reading under `persist_key`. Load returns false if there is
// none or it is older than `max_age_s`.
void cgm_last_save(uint32_t persist_key, const CgmLast *last);
bool cgm_last_load(uint32_t persist_key, CgmLast *last, int max_age_s);

// Wake timer for the iPump-mini source. PebbleKit JS timers are throttled while the
// phone app is in the background; the watch keeps reliable time and asks the phone at
// the announced wake of the iPhone app (+3 s, +11 s, +19 s).
// `request_fetch` must send your "request BG" message to the phone.
void cgm_wake_init(void (*request_fetch)(void));
// Call from your inbox handler: reads the next wake (Unix s) and interval (s).
void cgm_wake_handle_inbox(DictionaryIterator *iter, uint32_t key_next, uint32_t key_interval);
void cgm_wake_deinit(void);

// Tiny cloud (about 11 x 7 px) centred at `c`: marks a value from the Nightscout fallback.
void cgm_draw_cloud(GContext *ctx, GPoint c, GColor color);
