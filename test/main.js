/* eslint-disable */
/* global describe, it */

'use strict';

var should = require('should'),
    fs = require('fs'),
    path = require('path'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    es = require('event-stream'),
    inlineCss = require('../index');

function getFile(filePath) {
    return new gutil.File({
        path: path.resolve(filePath),
        cwd: './test/',
        base: path.dirname(filePath),
        contents: new Buffer(String(fs.readFileSync(filePath)))
    });
}

function compare(fixturePath, expectedPath, options, done) {
    // Create a plugin stream
    var stream = inlineCss(options);

    // write the fake file to it
    stream.write(getFile(fixturePath));

    // wait for the file to come back out
    stream.once('data', function (file) {
        // make sure it came out the same way it went in
        should.ok(file.isBuffer());

        // check the contents
        file.contents.toString('utf8').should.be.equal(String(fs.readFileSync(expectedPath)));
        done();
    });
}

describe('gulp-inline-css', function() {
    it('file should pass through', function(done) {
        var a = 0;

        var fakeFile = new gutil.File({
            path: './test/fixture/file.html',
            cwd: './test/',
            base: './test/fixture/',
            contents: new Buffer('Hello World!')
        });

        var stream = inlineCss();

        stream.on('data', function(newFile){
            should.ok(newFile.contents);
            should.equal(newFile.path, './test/fixture/file.html');
            should.equal(newFile.relative, 'file.html');
            ++a;
        });

        stream.once('end', function () {
            should.equal(a, 1);
            done();
        });

        stream.write(fakeFile);
        stream.end();
    });

    it('should let null files pass through', function(done) {
        var stream = inlineCss(),
            n = 0;

        stream.pipe(es.through(function(file) {
            should.equal(file.path, 'null.md');
            should.equal(file.contents,  null);
            n++;
        }, function() {
            should.equal(n, 1);
            done();
        }));

        stream.write(new gutil.File({
            path: 'null.md',
            contents: null
         }));

        stream.end();
    });

    it('should emit error on streamed file', function (done) {
      gulp.src(path.join('test', 'fixtures', 'in.html'), { buffer: false })
        .pipe(inlineCss())
        .on('error', function (err) {
          err.message.should.equal('Streaming not supported');
          done();
        });
    });

    it('Should convert linked css to inline css', function(done) {
        var options = {};
        compare(path.join('test', 'fixtures', 'in.html'), path.join('test', 'expected', 'out.html'), options, done);
    });

    it('Should inline css in multiple HTML files', function(done) {
        var options = {};
        compare(path.join('test', 'fixtures', 'multiple', 'one', 'in.html'), path.join('test', 'expected', 'multiple', 'one', 'out.html'), options, function () {});
        compare(path.join('test', 'fixtures', 'multiple', 'two', 'in.html'), path.join('test', 'expected', 'multiple', 'two', 'out.html'), options, done);
    });
});
