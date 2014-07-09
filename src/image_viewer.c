#include <pebble.h>

static Window *window;

static BitmapLayer  *image_layer;
static GBitmap      *image;
static uint8_t      *data_image;

static TextLayer    *text_layer;

#define KEY_IMAGE   0
#define KEY_INDEX   1
#define KEY_MESSAGE 2

#define CHUNK_SIZE 1500

static void cb_in_received_handler(DictionaryIterator *iter, void *context) {
  // Get the bitmap
  Tuple *image_tuple = dict_find(iter, KEY_IMAGE);
  Tuple *index_tuple = dict_find(iter, KEY_INDEX);
  if (index_tuple && image_tuple) {
    int32_t index = index_tuple->value->int32;

    APP_LOG(APP_LOG_LEVEL_DEBUG, "image received index=%ld size=%d", index, image_tuple->length);
    memcpy(data_image + index,&image_tuple->value->uint8,image_tuple->length);

    if(image_tuple->length < CHUNK_SIZE){
      if(image){
        gbitmap_destroy(image);
        image = NULL;
      }
      image = gbitmap_create_with_data(data_image);
      bitmap_layer_set_bitmap(image_layer, image);
      text_layer_set_text(text_layer, "");
      layer_mark_dirty(bitmap_layer_get_layer(image_layer));
    }
  }

  Tuple *message_tuple = dict_find(iter, KEY_MESSAGE);
  if(message_tuple){
    text_layer_set_text(text_layer, message_tuple->value->cstring);
  }
}

static void app_message_init() {
  // Register message handlers
  app_message_register_inbox_received(cb_in_received_handler);
  // Init buffers
  app_message_open(app_message_inbox_size_maximum(), APP_MESSAGE_OUTBOX_SIZE_MINIMUM);
}

static void select_click_handler(ClickRecognizerRef recognizer, void *context) {
  if(image){
    gbitmap_destroy(image);
    image = NULL;
    bitmap_layer_set_bitmap(image_layer, image);
  }
  text_layer_set_text(text_layer, "Updating image...");

  DictionaryIterator *iter;
  uint8_t value = 1;
  app_message_outbox_begin(&iter);
  dict_write_int(iter, KEY_IMAGE, &value, 1, true);
  dict_write_end(iter);
  app_message_outbox_send();
}

static void click_config_provider(void *context) {
  window_single_click_subscribe(BUTTON_ID_SELECT, select_click_handler);
}

static void window_load(Window *window) {
  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(window_layer);

  image = gbitmap_create_with_data(data_image);

  image_layer = bitmap_layer_create(bounds);
  bitmap_layer_set_bitmap(image_layer, image);
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
  bitmap_layer_destroy(image_layer);
  if(image){
    gbitmap_destroy(image);
    image = NULL;
  }
}

static void init(void) {
  app_message_init();
  data_image = malloc(sizeof(uint8_t) * (5 * 4) * 168 + 12);
  window = window_create();
  window_set_click_config_provider(window, click_config_provider);
  window_set_window_handlers(window, (WindowHandlers) {
    .load = window_load,
    .unload = window_unload,
  });
  window_set_fullscreen(window, true);
  window_stack_push(window, true);
}

static void deinit(void) {
  window_destroy(window);
  free(data_image);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}
