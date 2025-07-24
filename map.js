var t = window.TrelloPowerUp.iframe();
Promise.all([
  t.board('lists'),
  t.get('board','shared','pinColorMapping'),
  t.cards('all')
]).then(function(vals){
  var lists=vals[0].lists, mapping=vals[1]||{}, cards=vals[2];
  var map=L.map('map').setView([0,0],2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ attribution:'' }).addTo(map);
  cards.forEach(function(c){
    var locItem=c.customFieldItems.find(ci=>ci.idCustomField===CUSTOM_FIELD_ID);
    var listColor=mapping[c.idList]||'#3388ff';
    if(locItem && locItem.value){
      var lat=locItem.value.latitude, lon=locItem.value.longitude;
      L.circleMarker([lat,lon],{ radius:8, fillColor:listColor, color:listColor, weight:1, fillOpacity:0.9 }).addTo(map);
    }
  });
});
