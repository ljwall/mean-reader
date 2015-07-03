angular.module('reader.feeds')
.controller('ReaderCtrl', ['currentUserService', 'feedService', '$window', 'apiRoot', function (user, fs, $window, apiRoot) {
    var selected;

    this.itemFilter = {};
    this.updating = false;

    this.feedList = function () {
        return fs.getFeedMetaList();
    };

    this.displayedFeed = function () {
        return selected;
    };

    this.itemsList = function () {
        return fs.getFeedItems();
    };

    this.viewFeed = function (feedObj) {
        this.itemFilter.meta_apiurl = selected = feedObj.apiurl;
    };

    this.viewItem = function (itemObj) {
        fs.markAsRead(itemObj, true);
        $window.open(itemObj.link, '_blank');
    };

    var self=this;
    this.updateData = function () {
        this.updating = true;
        fs.updateData()
        .then(done, done);
        function done () {self.updating = false;}
    };

    this.isMore = function () {
        if (selected) {
            return !!fs.isMore()[selected];
        } else {
            return !!fs.isMore()[apiRoot];
        }
    };

    this.getMore = function () {
        if (selected) {
            return fs.getMore(selected);
        }
        return fs.getMore(apiRoot);
    };

    this.isUserAuthenticated = function () {
        return user.isAuthenticated();
    };

    this.markAllAsRead = function () {
        fs.markAllAsRead(selected);
    };

    this.anyChecked = function () {
        var i,
            items = fs.getFeedItems();
        for (i=0; i < items.length; i++) {
            if (items[i].checked) {
                return true;
            }
        }
        return false;
    };
    this.markAsUnread = function () {
        fs.getFeedItems().forEach(function (item) {
            if (item.checked) {
                item.checked = false
                fs.markAsRead(item, false)
            }
        });
    };
}]);
