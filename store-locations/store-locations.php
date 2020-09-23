<?php
/*
Plugin Name: Store Locations
Plugin URI: https://base22.com/
Description: Plugin to display pharmacies in map where a product is sold
Version: 1.1
Author: Base22
Author URI: 
License: 
*/
/* defined('ABSPATH') or die("Bye bye"); */

// Register and load the widget
function wpb_load_store_widget()
{
    register_widget('wpb_store_locations_widget');
}
add_action('widgets_init', 'wpb_load_store_widget');
add_action('wp_enqueue_scripts', 'callback_for_files');

function callback_for_files() {
  wp_register_style( 'mapcss' , plugins_url( '/css/styles.css',  __FILE__));/*Include file with Map styles*/
  wp_register_script( 'mapjs' , plugins_url( '/js/store-locations.js',  __FILE__));
  wp_enqueue_style( 'mapcss' );
  wp_enqueue_script( 'mapjs' );
}

// Creating the widget 
class wpb_store_locations_widget extends WP_Widget
{
    
    function __construct()
    {
        parent::__construct(
        // Base ID of your widget
            'wpb_store_locations_widget', 
        // Widget name will appear in UI
            __('Store Locations', 'wpb_store_locations_widget_domain'), 
        // Widget description
            array(
            'description' => __('Location from stores that sell our products will be drawn in Google Maps')
        ));
    }
    
    // Creating widget front-end
    
    public function widget($args, $instance)
    {
        $title = apply_filters('widget_title', $instance['title']);
        
        // before and after widget arguments are defined by themes
        echo $args['before_widget'];
        if (!empty($title))
            echo $args['before_title'] . $title . $args['after_title'];
        
        // This is where you run the code and display the output
        echo $args['after_widget'];

        ?>

        <!-- Set here a style tag in case you dont want to call an external css file -->

        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.2/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous">

        <div class="b-store-locations">  

          <div class="b-map-searching">
            <h3>Encuentra una farmacia cerca de ti</h3>
            <p class="b-map-searching__blurb">Nuestra búsqueda permite que encuentres farmacias con con Productos Nartex por Padecimiento, Productos o Dirección.</p>
            <input id = "b-map-searching__input" type="textbox" placeholder="Introduce tu dirección">
            <button id="b-map-searching__button" onclick="readInput()"><i class="fas fa-search"></i></button>

            <div class="b-map-searching__results-banner not-results-banner">0 Resultados encontrados</div>
            <div id="b-map-searching__store" class="b-map-searching__store-containerStore">
              <div class="b-store-element">
                <!-- Address and Phone -->
              </div>
            </div>

            <div class="b-map-searching__not-found not-found-show">
              <!--<img src="<?php echo plugins_url('/images/icon_map_notFound.png', __FILE__); ?>">-->
              <p>¡Lo sentimos! No encontramos productos Nartex cerca de tu ubicaci&oacute;n.  Si deseas comprarlos en línea visita <a href="www.farmahabit.com">Farmahabit</a>.</p>
            </div>

          </div>

          <div id="map"></div>

        </div>

    <?php 

    function getCustomFieldLocations(){
      $csvFileWP;

      $queryParameters = array(
            'page_id' => 393
        );
        $query = new WP_Query($queryParameters);

        if($query->have_posts()){
          while($query->have_posts()) {
            $query->the_post();
            $csvFileWP = get_post_meta(get_the_ID(),'Locations');
          }
        }
        else
        {
          echo "Page ID was updated";
        }
        return $csvFileWP[0];

    }

    $filaIndex = 0;

    $csvData;

    $fileURL = getCustomFieldLocations();

    $csv = file_get_contents($fileURL);
    $csvData = array_map("str_getcsv", explode("\n", $csv));
    $jsonString = json_encode($csvData);

    echo "<script> window.items = " . $jsonString ." ; </script>"
    
    ?>

    <script type="text/javascript">
      var storeLocations = new StoreLocations();
      storeLocations.getFileFromMediaLibrary();

      function readInput(){
        console.log('Executando Search');
        storeLocations.readInputSearch();
      }

      function startMap(){
        storeLocations.drawMap();
      }

    </script>

    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBCXpP9AbR4xJJ_O2YzcrczTfj27M-ZK7M&callback=startMap" async defer></script>
        
        <?php
    }/*Closure from widget front-end PHP function*/
    
    // Widget Backend 
    public function form($instance)
    {
        if (isset($instance['title'])) {
            $title = $instance['title'];
        } else {
            $title = __('New title', 'wpb_store_locations_widget_domain');
        }
        // Widget admin form
?>
<p>
<label for="<?php
        echo $this->get_field_id('title');
?>"><?php
        _e('Title:');
?></label> 
<input class="widefat" id="<?php
        echo $this->get_field_id('title');
?>" name="<?php
        echo $this->get_field_name('title');
?>" type="text" value="<?php
        echo esc_attr($title);
?>" />
</p>
<?php
    }
    
    // Updating widget replacing old instances with new
    public function update($new_instance, $old_instance)
    {
        $instance          = array();
        $instance['title'] = (!empty($new_instance['title'])) ? strip_tags($new_instance['title']) : '';
        return $instance;
    }
} // Class wpb_store_locations_widget ends here

?>