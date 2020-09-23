!function() {

  function renameProperty(currentPropertiesObject) {
      return {
        Id: currentPropertiesObject["0"],
        FarmaBrand: currentPropertiesObject["1"],
        FarmaStore: currentPropertiesObject["2"],
        Latitude: currentPropertiesObject["3"],
        Longitude: currentPropertiesObject["4"],
        Promote: currentPropertiesObject["5"],
        ProductName: currentPropertiesObject["6"],
        NomVial: currentPropertiesObject["7"],
        NumeroExt: currentPropertiesObject["8"],
        NombAsent: currentPropertiesObject["9"],
        Municipio: currentPropertiesObject["10"],
        Entidad: currentPropertiesObject["11"],
        Country: currentPropertiesObject["12"],
        CodPostal: currentPropertiesObject["13"],
        Telefono: currentPropertiesObject["14"]
      };
  }

  function handleLocationError(browserHasGeolocation, infoWindow, pos) {
      infoWindow.setPosition(pos);
      infoWindow.setContent(browserHasGeolocation ?
          'Error: The Geolocation service failed.' :
          'Error: Your browser doesn\'t support geolocation.');
      infoWindow.open(map);
  }

  function precisionRound(number, precision) {
      var factor = Math.pow(10, precision);
      return Math.round(number * factor) / factor;
  }

  function linealDinstance(lat1, lon1, lat2, lon2) {
      var pi = Math.PI;
      var R = 6371; //equatorial radius

      var chLat = lat2 - lat1;
      var chLon = lon2 - lon1;

      var dLat = chLat * (pi / 180);
      var dLon = chLon * (pi / 180);

      var rLat1 = lat1 * (pi / 180);
      var rLat2 = lat2 * (pi / 180);

      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c;

      // (debug) The closest marker is:
      return precisionRound(d, 1);
  }

  function StoreLocations() {
      this.filteredStores;
      this.stores = [];
      this.map;
      this.marker = [];
      this.bounds = {};
      this.usersLocation;
      this.nearestStores = [];
  }

  StoreLocations.prototype.getFileFromMediaLibrary = function() {
      var self = this;
      var stores = [];
      var i = 0;

      window.items.forEach(function(element, index) {
          self.stores[i] = Object.assign({}, element);
          /* self.stores[i] = {...element }; Convert every string in the array to an object */
          self.stores[i] = renameProperty(self.stores[i]); //Change property name's object {"1":PharmacyX} => {"FarmaBrand":PharmacyX} 
          i++;
      });

      this.stores = self.stores;
      console.log('STORES: ', this.stores);
  }


  StoreLocations.prototype.cleanDOM = function() { /*Clean DOM from last searches*/

      document.querySelector('.b-map-searching__results-banner').classList.remove('not-results-banner');
      document.querySelector('.b-map-searching__not-found').classList.remove('not-found-show');

      var storesContainer = document.querySelector('#b-map-searching__store');
      var numberResults = document.querySelector('.b-map-searching__results-banner');

      if (storesContainer.hasChildNodes()) {
          while (storesContainer.childNodes.length >= 1) {
              storesContainer.removeChild(storesContainer.firstChild);
          }
      }

      if (numberResults.hasChildNodes()) {
          while (numberResults.childNodes.length >= 1) {
              numberResults.removeChild(numberResults.firstChild);
          }
      }
  }

  StoreLocations.prototype.readInputSearch = function() { //Here is where filteredStores is filled

      var self = this;
      console.log('SIZE Store: ', this.stores);
      var inputSearch = document.querySelector('#b-map-searching__input').value;
      console.log('INPUT ', inputSearch);

      if (inputSearch != "" && inputSearch.length > 0) {
          if (this.stores.length > 0) {
              console.log('Num Stores: ', this.stores.length);
              self.filteredStores = this.stores.filter(function(store, index) {
                  var regex = new RegExp(inputSearch, "ig");
                    try{
                        return store.FarmaBrand.match(regex) || store.ProductName.match(regex) || store.FarmaStore.match(regex);
                    }catch(e){
                        console.log("Incorrect data format in row ", index +" from CSV file", e );
                    }
              });

              console.log("filtered stores ", self.filteredStores);
              console.log('Num Stores: ', self.filteredStores.length);
              //Set here calculateNearElements()
              this.nearestStores = self.calculateNearElements(self.filteredStores); //Assign result to this.nearestStores
              console.log('Nearest stores', this.nearestStores);
              self.drawTable();
              self.drawPines(this.nearestStores);
          } else {
              console.log('Store array VACIO');
          }
      }

  }

  StoreLocations.prototype.showMarkerById = function(id, showMarker) {

      var self = this;
      var marker = self.marker.find(function(element, index) {
          return element.id === id;
      });
      var position = new google.maps.LatLng(marker.lat, marker.lng);
      var temporalBounds = new google.maps.LatLngBounds();
      temporalBounds.extend(position);

      if (showMarker) {
          self.map.fitBounds(temporalBounds);
      } else {
          self.map.fitBounds(self.bounds);
      }

  };

  StoreLocations.prototype.drawTable = function() {
      var self = this;
      var quantityStores = document.querySelector('.b-map-searching__results-banner');

      console.log('RUNNING drawTable', this.nearestStores.length);
      if (this.nearestStores.length > 0) {

          self.cleanDOM();

          quantityStores.innerHTML = '<span>' + this.nearestStores.length + ' Resultados encontrados</span>';

          var activeId;

          this.nearestStores.forEach(function(element, index) {
              var containerStore = document.querySelector('#b-map-searching__store');
              var divStore = document.createElement('div');
              divStore.className = 'b-store-element';
              divStore.addEventListener('click', function() {
                  if (activeId == element.Id) {
                      self.showMarkerById(activeId, false);
                      activeId = "";
                  } else {
                      activeId = element.Id;
                      self.showMarkerById(activeId, true);
                  }

              });

              var divStoreName = document.createElement('div');
              divStoreName.className = 'b-store-element__title';
              var pharmacyName = document.createTextNode(element.FarmaBrand);

              var divAddress = document.createElement('div');
              divAddress.className = 'b-store-element__address';
              var pharmacyAddress = document.createTextNode(element.NomVial + (element.NumeroExt.toString() !== ""? " #" + element.NumeroExt.toString(): "" )  + ", " + element.NombAsent + ", CP " + element.CodPostal + " " + element.Municipio + ", " + element.Entidad);
              /*Icon font awesome Pin*/
              var italicAddress = document.createElement('i');
              italicAddress.className = 'fas fa-map-marker-alt';


              var divStorePhone = document.createElement('div');
              divStorePhone.className = 'b-store-element__phone';
              var pharmacyPhone = document.createTextNode(element.Telefono);
              /*Icon font awesome Phone*/
              var italicPhone = document.createElement('i');
              italicPhone.className = 'fas fa-phone';

              divStoreName.appendChild(pharmacyName);
              divAddress.appendChild(italicAddress);
              divAddress.appendChild(pharmacyAddress);

              divStore.appendChild(divStoreName);
              divStore.appendChild(divAddress);

              if (element.Telefono !== "") {
                  divStorePhone.appendChild(italicPhone);
                  divStorePhone.appendChild(pharmacyPhone);
              }
              divStore.appendChild(divStorePhone);

              containerStore.appendChild(divStore);
          });
      } else {
          self.cleanDOM();
          document.querySelector('.b-map-searching__results-banner').classList.add('not-results-banner');
          document.querySelector('.b-map-searching__not-found').classList.add('not-found-show');
          quantityStores.innerHTML = '<span>' + this.nearestStores.length + ' Resultados encontrados</span>';
      }
  }

  StoreLocations.prototype.locateUser = function(argument) {
      var self = this;
      var permissionToLocate;
      self.usersLocation = this.usersLocation;
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
              var pos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
              };

              self.usersLocation = pos;

              self.map.setCenter(pos);
              self.map.setZoom(12);
              console.log('Coord: ', self.usersLocation);
              console.log('Bounds', self.map.getBounds());
              this.usersLocation = self.usersLocation;

          }, function() {
              permissionToLocate = false;
          });
      } else {
          permissionToLocate = false;
      }

      return permissionToLocate;
  }

  StoreLocations.prototype.drawMap = function() {

      var self = this;

      this.map = new google.maps.Map(document.getElementById('map'), {
          center: {
              lat: 23.0000000,
              lng: -102.0000000
          },
          zoom: 6,
          mapTypeId: 'roadmap' /* satellite | hybrid | terrain */
      });

      self.locateUser();

  }


  StoreLocations.prototype.drawPines = function(addresses) {
      console.log('Drawing Pines: ', addresses);

      var self = this;
      self.map = this.map;
      self.marker = this.marker;

      self.bounds = new google.maps.LatLngBounds();

      console.log('The reference MAP: ', self.map);


      if (this.nearestStores.length > 0) {

          /* Clean map from pines drawn before*/
          while (self.marker.length) {
              self.marker.pop().setMap(null);
          }

          addresses.forEach(function(element, index) {
              var position = new google.maps.LatLng(parseFloat(element.Latitude), parseFloat(element.Longitude));
              self.marker[index] = new google.maps.Marker({
                  lat: parseFloat(element.Latitude),
                  lng: parseFloat(element.Longitude),
                  id: element.Id,
                  map: self.map,
                  position: position
              });
              self.marker[index].addListener('click', function() {
                  var zoomLevel = self.map.getZoom();
                  console.log("Zoom: " + zoomLevel);
                  if (zoomLevel < 15) {
                      self.map.setZoom(20);
                      self.map.setCenter(self.marker[index].getPosition());
                  } else {
                      if (zoomLevel >= 20) {
                          self.map.fitBounds(self.bounds);
                      }
                  }
              });
              self.bounds.extend(position);

          });
          self.map.fitBounds(self.bounds);

      } else {
          /* Clean map from pines drawn before*/
          while (self.marker.length) {
              self.marker.pop().setMap(null);
          }

          var position = new google.maps.LatLngBounds();
          position.extend({
              lat: 23.0000000,
              lng: -102.0000000
          }); /*Map of Mexico*/
          self.map.fitBounds(self.bounds);
      }

  }

  StoreLocations.prototype.calculateNearElements = function(data) {
      var nearestPoints = [];
      var distanceAway = 0;

      console.log('USERS LOC', this.usersLocation);
      //console.log('USERS PROP', this.usersLocation.lat);

      if (this.usersLocation && this.usersLocation.lat !== "") {
          data.forEach(function(point, index) {
              distanceAway = linealDinstance(this.usersLocation.lat, this.usersLocation.lng, point.Latitude, point.Longitude);
              if (distanceAway < 15) { //Radius in km 
                  point.distanceAway = distanceAway;
                  nearestPoints.push(point);
              }
          });
      } else {
          data.forEach(function(point, index) {
              distanceAway = linealDinstance(23.0000000, -102.0000000, point.Latitude, point.Longitude);
              point.distanceAway = distanceAway;
              nearestPoints.push(point);
          });
      }

      return nearestPoints.sort(function(a, b) {
          return a.distanceAway - b.distanceAway
      }); /*Sorts nearest stores to user location*/
  }

  window.StoreLocations = StoreLocations;

}();