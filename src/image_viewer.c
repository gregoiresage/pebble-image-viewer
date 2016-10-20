#include <pebble.h>
#include <pebble-events/pebble-events.h>

#include "enamel.h"

static Window *window;

static BitmapLayer  *image_layer;
static GBitmap      *image = NULL;
static uint8_t      *data_image = NULL;
static uint32_t     data_size;

static TextLayer    *text_layer;

static EventHandle s_enamel_event_handle;
static EventHandle s_image_event_handle;

#define CHUNK_SIZE 6000

static void prv_image_received_handler(DictionaryIterator *iter, void *context) {
  // Get the bitmap
 
  Tuple *size_tuple  = dict_find(iter, MESSAGE_KEY_size);
  if(size_tuple){
    if(data_image)
      free(data_image);
    data_size = size_tuple->value->uint32;
    data_image = malloc(data_size);
  }

  Tuple *image_tuple = dict_find(iter, MESSAGE_KEY_chunk);
  Tuple *index_tuple = dict_find(iter, MESSAGE_KEY_index);
  if (index_tuple && image_tuple) {
    int32_t index = index_tuple->value->int32;

    APP_LOG(APP_LOG_LEVEL_DEBUG, "image received index=%ld size=%d", index, image_tuple->length);
    memcpy(data_image + index,&image_tuple->value->uint8,image_tuple->length);

    if(image_tuple->length < CHUNK_SIZE){
      if(image){
        gbitmap_destroy(image);
        image = NULL;
      }
#ifdef PBL_COLOR
      image = gbitmap_create_from_png_data(data_image, data_size);
#else
      image = gbitmap_create_with_data(data_image);
#endif
      bitmap_layer_set_bitmap(image_layer, image);
      text_layer_set_text(text_layer, "");
      layer_mark_dirty(bitmap_layer_get_layer(image_layer));
    }
  }

  Tuple *message_tuple = dict_find(iter, MESSAGE_KEY_message);
  if(message_tuple){
    text_layer_set_text(text_layer, message_tuple->value->cstring);
  }
}

static void get_image(){
  if(image){
    gbitmap_destroy(image);
    image = NULL;
    bitmap_layer_set_bitmap(image_layer, image);
  }

  text_layer_set_text(text_layer, "Updating image...");

  DictionaryIterator *iter;
  app_message_outbox_begin(&iter);
  dict_write_cstring(iter, MESSAGE_KEY_url, enamel_get_url());
  dict_write_end(iter);
  app_message_outbox_send();
}

static void select_click_handler(ClickRecognizerRef recognizer, void *context) {
  get_image();
}

static void click_config_provider(void *context) {
  window_single_click_subscribe(BUTTON_ID_SELECT, select_click_handler);
}

static void window_load(Window *window) {
  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(window_layer);

  image_layer = bitmap_layer_create(bounds);
  bitmap_layer_set_alignment(image_layer, GAlignCenter);
  layer_add_child(window_layer, bitmap_layer_get_layer(image_layer));

  text_layer = text_layer_create(GRect(0, bounds.size.h - 16, bounds.size.w, 16));
  text_layer_set_text(text_layer, "Press select");
  text_layer_set_font(text_layer, fonts_get_system_font(FONT_KEY_GOTHIC_14));
  text_layer_set_text_alignment(text_layer, GTextAlignmentCenter);
  text_layer_set_background_color(text_layer, GColorClear);
  layer_add_child(window_layer, text_layer_get_layer(text_layer));
}

static void window_unload(Window *window) {
  text_layer_destroy(text_layer);
  bitmap_layer_destroy(image_layer);
  if(image){
    gbitmap_destroy(image);
  }
  if(data_image){
    free(data_image);
  }
}

static void prv_settings_received_handler(void *context){
  get_image();
}

static void init(void) {
  enamel_init();
  s_enamel_event_handle = enamel_settings_received_subscribe(prv_settings_received_handler, NULL);

  events_app_message_request_inbox_size(6500);
  events_app_message_request_outbox_size(150);

  s_image_event_handle = events_app_message_register_inbox_received(prv_image_received_handler, NULL);

  events_app_message_open();

  window = window_create();
  window_set_click_config_provider(window, click_config_provider);
  window_set_window_handlers(window, (WindowHandlers) {
    .load = window_load,
    .unload = window_unload,
  });
  window_stack_push(window, true);
}

static void deinit(void) {
  enamel_settings_received_unsubscribe(s_enamel_event_handle);
  events_app_message_unsubscribe(s_image_event_handle);
  enamel_deinit();
  window_destroy(window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}
