angular.module('main', ['restangular', 'templates-app', 'SocketIO', 'leaflet-directive', '$strap.directives']).

  config(function(RestangularProvider) {

    RestangularProvider.setBaseUrl('/labapi');
    RestangularProvider.setRestangularFields({
      id: '_id.$oid'
    });

    RestangularProvider.setRequestInterceptor(function(elem, operation, what) {

      if (operation === 'put') {
        elem._id = undefined;
        return elem;
      }
      return elem;
    });
  })

  .controller('MainCtrl', function($scope, Restangular, socket) {
    $scope.projects = Restangular.all('projects').getList();

    socket.on('event:userlogin', function(data) {
      Notifier.apple(data.name.first + ' ' + data.name.last + ' has logged in.', 'User Logged In', data.color, function() {
        window.location = "/contributor/" + data.userId;
      });
    });
    socket.on('event:userlogout', function(data) {
      Notifier.apple(data.name.first + ' ' + data.name.last + ' has logged out.', 'User Logged Out', data.color);
    });
    socket.on('market:added', function(data) {
      Notifier.info(data.name.first + 'was added.', 'New Market Added', function() {
        window.location = "/market/" + data.market;
      });
    });

    $scope.$on('$destroy', function (event) {
      socket.removeAllListeners();
    });
  });