#include <pebble.h>
#include <pebble-events/pebble-events.h>
#include <pebble-image-grabber/pebble-image-grabber.h>

#include "enamel.h"

static Window *window;

static BitmapLayer  *image_layer;
static GBitmap      *image = NULL;

static TextLayer    *text_layer;

static EventHandle s_enamel_event_handle;

static void prv_image_cb(uint8_t *data, uint16_t size, ImageGrabberStatus status){
  
  if(status == ImageGrabberDone){
    APP_LOG(0, "DONE -> total size = %d bytes", size);
    if(image){
      gbitmap_destroy(image);
      image = NULL;
    }
#ifdef PBL_COLOR
    image = gbitmap_create_from_png_data(data, size);
#else
    image = gbitmap_create_with_data(data);
#endif
    free(data);
    bitmap_layer_set_bitmap(image_layer, image);
    text_layer_set_text(text_layer, "");
  }
  else if(status == ImageGrabberStatusPending){
    APP_LOG(0, "PENDING size %d", size);
    text_layer_set_text(text_layer, "PENDING");
  }
  else if(status == ImageGrabberStatusFailed){
    APP_LOG(0, "FAILURE");
    text_layer_set_text(text_layer, "FAILURE");
  }
  else if(status == ImageGrabberNotAnImage){
    APP_LOG(0, "ImageGrabberNotAnImage");
    text_layer_set_text(text_layer, "Wrong format");
  }
}

static void get_image(){
  if(image){
    gbitmap_destroy(image);
    image = NULL;
    bitmap_layer_set_bitmap(image_layer, image);
  }
  image_grabber_get(enamel_get_url());
  text_layer_set_text(text_layer, "Request sent");
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
}

static void prv_settings_received_handler(void *context){
  get_image();
}

static void init(void) {
  enamel_init();
  s_enamel_event_handle = enamel_settings_received_subscribe(prv_settings_received_handler, NULL);

  image_grabber_init((ImageGrabberSettings){
    .chunk_size = 6000,
    .callback = prv_image_cb
  });

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
  enamel_deinit();
  image_grabber_deinit();
  window_destroy(window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}
