var Promise = TrelloPowerUp.Promise;
var CUSTOM_FIELD_ID = 'O4AmtxE5C3qU31';

window.TrelloPowerUp.initialize({
  'card-buttons': renderImportButton,
  'card-badges': badgeGPSImportStatus,
  'board-buttons': renderBoardButtons,
  'show-settings': showSettings
});

// 1) Card-Button: Manuelle EXIF-Import-Option
function renderImportButton(t, opts) {
  return t.card('attachments')
    .then(function(card){
      var hasImage = card.attachments.some(a=>/\.(jpe?g|png)$/i.test(a.url));
      return hasImage ? [{ icon: 'https://jseegger.github.io/postertracker/images/gps.png', text: 'EXIF-Location importieren', callback: importAllExif }] : [];
    });
}

function importAllExif(t){
  return t.card('attachments','id')
    .then(function(card){
      var imgs = card.attachments.filter(a=>/\.(jpe?g|png)$/i.test(a.url));
      return Promise.all(imgs.map(att=>importExif(t, att.url)));
    });
}

function importExif(t, url){
  return new Promise(function(resolve){
    var img = new Image(); img.crossOrigin = 'Anonymous';
    img.onload = function(){
      EXIF.getData(img, function(){
        var lat = EXIF.getTag(this,'GPSLatitude');
        var lon = EXIF.getTag(this,'GPSLongitude');
        var latRef = EXIF.getTag(this,'GPSLatitudeRef')||'N';
        var lonRef = EXIF.getTag(this,'GPSLongitudeRef')||'W';
        if(lat && lon){
          var latDD = dmsToDd(lat,latRef), lonDD = dmsToDd(lon,lonRef);
          t.card('id').then(function(card){
            return fetch('https://api.trello.com/1/cards/'+card.id+'/customField/'+CUSTOM_FIELD_ID+'/item?key=936db264990cf00e7c23d72d01c324c8&token='+ t.getJwt(),{
              method:'PUT', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({value:{latitude:latDD,longitude:lonDD}})
            });
          }).then(function(){ resolve(t.alert({ message:'GPS importiert: '+latDD+','+lonDD })); });
        } else { resolve(t.alert({ message:'Keine GPS-Daten gefunden.' })); }
      });
    };
    img.src = url;
  });
}
function dmsToDd(dms, ref){ var dd = dms[0] + dms[1]/60 + dms[2]/3600; return (ref==='S'||ref==='W')? -dd : dd; }

// 2) Badge: Status-Anzeige
function badgeGPSImportStatus(t, opts){
  return t.card('customFieldItems').then(function(items){
    var has = items.some(i=>i.idCustomField===CUSTOM_FIELD_ID && i.value && i.value.latitude);
    return has? [{ text:'✔️ GPS gesetzt', color:'green' }]: [];
  });
}

// 3) Board-Button: Öffne Custom Map
function renderBoardButtons(t, opts){
  return [{ icon:{light:'https://jseegger.github.io/postertracker/images/map-light.png',dark:'https://jseegger.github.io/postertracker/images/map-dark.png'}, text:'Karte anzeigen', callback: showCustomMap }];
}
function showCustomMap(t){
  return t.popup({ url:'https://jseegger.github.io/postertracker/map.html', title:'Custom Map', height:600 });
}

// 4) Einstellungen-Dialog
function showSettings(t, opts){
  return t.popup({ title:'Pin-Farben Einstellungen', url:'https://jseegger.github.io/postertracker/settings.html', height:300 });
}
