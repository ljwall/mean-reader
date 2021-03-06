var mongoFeedStore = require('../../../webserv/feed_handle/utils/mongoFeedStore.js'),
    Promise = require('bluebird'),
    db = require('../../../webserv/mongoConnect.js'),
    ObjectID = require('mongodb').ObjectID;

Promise.longStackTraces();

var clearDB = function (done) {
    Promise.all([
        db.posts.call('deleteManyAsync', {}),
        db.feeds.call('deleteManyAsync', {})
    ])
    .done(done);
};

describe('mongoFeedStore', function () {
    var sampledata1 = {
            meta: {_id: new ObjectID('000000000000000000000001'), link: 'url', feedurl: 'feedurl', title: 'blog'},
            items: [{feedurl: 'feedurl', guid: '1', title: 'T1', }, {feedurl: 'feedurl', guid: '2', title: 'T2'}]
        };

    beforeAll(clearDB);

    describe('saveFeedItemContent', function () {
        it('should save item content');
        it('should not double-insert content');
    });

    describe('updateMongoFeedData', function () {
        afterEach(clearDB);

        it('should put the feed data in the DB', function (done){
            mongoFeedStore.updateMongoFeedData(sampledata1, 'FOO_UID')
            .then(function (insert_res) {
                return Promise.all([
                    db.feeds.find({}).toArrayAsync(),
                    db.posts.find({}).toArrayAsync()
                ]);
            }).then(function (db_data) {
                expect(db_data[0].length).toEqual(1);
                expect(db_data[0][0].title).toEqual('blog');
                expect(db_data[0][0].user_id).toEqual('FOO_UID');
                expect(db_data[0][0].last_update).toBeDefined();
                expect(db_data[1].length).toEqual(2);
                expect(db_data[1]).toContain(jasmine.objectContaining({guid: '1', title: 'T1', user_id: 'FOO_UID'}));
                expect(db_data[1]).toContain(jasmine.objectContaining({guid: '2', title: 'T2', user_id: 'FOO_UID'}));
                expect(db_data[1][0].last_update).toBeDefined();
                expect(db_data[1][1].last_update).toBeDefined();
            })
            .done(done);
        });

        it('should not double insert exiting data', function (done){
            var sampledata2 = {
                meta: {link: 'url', feedurl: 'feedurl', title: 'New title'},
                items: [{guid: '2', title: 'NewT2'}, {guid: '3', title: 'T3'}]
            };
            sampledata1.items[0].meta_id = sampledata1.meta._id;
            sampledata1.items[1].meta_id = sampledata1.meta._id;
            sampledata1.items[0].user_id = 'FOO_UID';
            sampledata1.items[1].user_id = 'FOO_UID';
            sampledata1.meta.user_id = 'FOO_UID';

            Promise.all([
                db.feeds.call('insertOneAsync', sampledata1.meta),
                db.posts.call('insertManyAsync', sampledata1.items)
            ])
            .then(function (insert_res) {
                return mongoFeedStore.updateMongoFeedData(sampledata2, 'FOO_UID');
            })
            .then(function (insert_res) {
                return Promise.all([
                    db.feeds.find({}).toArrayAsync(),
                    db.posts.find({}).toArrayAsync()
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
});
