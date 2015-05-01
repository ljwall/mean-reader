var mongoFeedStore = require('../../webserv/feed_handle/utils/mongoFeedStore.js'),
    Promise = require('bluebird'),
    mongodb = require("mongodb"),
    MongoClient = Promise.promisifyAll(mongodb.MongoClient);

Promise.promisifyAll(mongodb.Collection.prototype);
Promise.promisifyAll(mongodb.Cursor.prototype);

Promise.longStackTraces();


var clearDB = function (db) {
    return Promise.all([
        db.collection('posts').deleteManyAsync({}),
        db.collection('feeds').deleteManyAsync({})
    ]);
};
    
describe('mongoFeedStore', function () {
    var mongodb,
        sampledata1 = {
            meta: {link: 'url', feedurl: 'feedurl', title: 'blog'},
            items: [{feedurl: 'feedurl', guid: '1', title: 'T1'}, {feedurl: 'feedurl', guid: '2', title: 'T2'}]
        };
    
    beforeAll(function (done) {
        MongoClient.connectAsync('mongodb://127.0.0.1:27017/testwomble')
        .then(function(db) {
            mongodb = db;
            return db;
        })
        .then(clearDB)
        .done(done);
    });
    afterEach(function (done) {
        clearDB(mongodb).done(done);
    });
    afterAll(function () {
        mongodb.close();
    });
    
    describe('updateMongoFeedData', function () {    
        it('should put the feed data in the DB', function (done){
            mongoFeedStore.updateMongoFeedData(sampledata1, mongodb)
            .then(function (insert_res) {
                return Promise.all([
                    mongodb.collection('feeds').find({}).toArrayAsync(),
                    mongodb.collection('posts').find({}).toArrayAsync()
                ]);
            }).then(function (db_data) {
                expect(db_data[0].length).toEqual(1);
                expect(db_data[0][0].title).toEqual('blog');
                expect(db_data[1].length).toEqual(2);
                expect(db_data[1]).toContain(jasmine.objectContaining({guid: '1', title: 'T1'}));
                expect(db_data[1]).toContain(jasmine.objectContaining({guid: '2', title: 'T2'}));
            })
            .done(done);
        });
        
        it('should not double insert exiting data', function (done){
            var sampledata2 = {
                    meta: {link: 'url', feedurl: 'feedurl', title: 'New title'},
                    items: [{feedurl: 'feedurl', guid: '2', title: 'NewT2'}, {feedurl: 'feedurl', guid: '3', title: 'T3'}]
                };
            mongoFeedStore.updateMongoFeedData(sampledata1, mongodb)
            .then(function (insert_res) {
                return mongoFeedStore.updateMongoFeedData(sampledata2, mongodb)
            })
            .then(function (insert_res) {
                return Promise.all([
                    mongodb.collection('feeds').find({}).toArrayAsync(),
                    mongodb.collection('posts').find({}).toArrayAsync()
                ]);
            }).then(function (db_data) {
                expect(db_data[0].length).toEqual(1);
                expect(db_data[0][0].title).toEqual('New title');
                expect(db_data[1].length).toEqual(3);
                expect(db_data[1]).toContain(jasmine.objectContaining({guid: '1', title: 'T1'}));
                expect(db_data[1]).toContain(jasmine.objectContaining({guid: '2', title: 'NewT2'}));
                expect(db_data[1]).toContain(jasmine.objectContaining({guid: '3', title: 'T3'}));
            })
            .done(done);
        });
    });

    describe('getMongoFeedData', function () {    
        it('should get the feed data in the DB', function (done){
            mongoFeedStore.updateMongoFeedData(sampledata1, mongodb) // should not really rely on updateMongoFeedData here!
            .then(function (insert_res) {
                return mongoFeedStore.getMongoFeedData('feedurl', mongodb);
            })
            .then(function (data) {
                expect(data.meta.title).toEqual('blog');
                expect(data.items.length).toEqual(2);
                expect(data.items).toContain(jasmine.objectContaining({feedurl: 'feedurl', title: 'T2'}));
            })
            .done(done);
        });
    });
    
    //describe('updateFeedFromSource', function () {
    //    it('should get data if none is already there', function (done) {
    //        spyOn(feed_updater, 'getFeedFromSource').and.returnValue(Promise.resolve(sampledata1));
    //        spyOn(feed_updater, 'updateFeedData');
    //        feed_updater.updateFeedFromSource('feedurl', mongodb)
    //        .then(function (res) {
    //            expect(feed_updater.getFeedFromSource).toHaveBeenCalledWith('feedurl');
    //            expect(feed_updater.getFeedFromSource.calls.count()).toEqual(1);
    //            expect(feed_updater.updateFeedData).toHaveBeenCalledWith(sampledata1, mongodb);
    //            expect(feed_updater.updateFeedData.calls.count()).toEqual(1)
    //        })
    //        .done(done);
    //    });
    //});
    
});