angular.module('project', ['restangular', 'templates-app', 'SocketIO', 'leaflet-directive', '$strap.directives']).

  config(function($routeProvider, RestangularProvider) {
    $routeProvider.
      when('/', {controller:'ListCtrl', templateUrl:"project/list.tpl.html"}).
      when('/edit/:projectId', {controller:'EditCtrl', templateUrl:"project/detail.tpl.html"}).
      when('/new', {controller:'CreateCtrl', templateUrl:"project/detail.tpl.html"}).
      otherwise({redirectTo:'/'});

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
    })
  })

.controller('ListCtrl', function($scope, Restangular, socket) {
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
})

.controller('CreateCtrl', function($scope, $location, Restangular, socket) {
  $scope.save = function() {
    Restangular.all('projects').post($scope.project).then(function(project) {
      $location.path('/list');
    });
  };
})

.controller('EditCtrl', function($scope, $location, $routeParams, Restangular, socket) {
  var self = this;
  Restangular.one('projects', $routeParams.projectId).get().then(function(project) {
    self.original = project;
    $scope.project = Restangular.copy(self.original);
  });


  $scope.isClean = function() {
    return angular.equals(self.original, $scope.project);
  };

  $scope.destroy = function() {
    self.original.remove().then(function() {
      $location.path('/list');
    });
  };

  $scope.save = function() {
    $scope.project.put().then(function() {
      $location.path('/');
    });
  };
});
