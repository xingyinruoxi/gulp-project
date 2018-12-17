const gulp = require('gulp'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    $ = gulpLoadPlugins(),
    browserSync = require('browser-sync').create(),
    reload = browserSync.reload,
    map = require("map-stream"),
    // babel=require('gulp-babel'),
    runSequence = require('run-sequence')//控制task顺序
;

/* 编译jade */
gulp.task('dev-jade', function () {
    console.log('dev-jade');
    return gulp.src(['!./src/layout.jade', './src/**/*.jade'])
        .pipe($.jade({pretty: true}))
        .pipe(gulp.dest('./dist'))
        .pipe(reload({stream: true}));
});

/* 编译css */
gulp.task('dev-css-min', function () {
    console.log('dev-css-min');
    return gulp.src([
        '!./src/stylesheet/less/*.less',
        './src/stylesheet/**/*.less'
    ])
        .pipe($.less())
        .pipe($.cssSpriter({
            // The path and file name of where we will save the sprite sheet
            'spriteSheet': './dist/img/spritesheet.png', //这是雪碧图自动合成的图。
            // Because we don't know where you will end up saving the CSS file at this point in the pipe,
            // we need a litle help identifying where it will be.
            'pathToSpriteSheetFromCSS': '../img/spritesheet.png' //这是在css引用的图片路径
        }))
        .pipe($.concat('gw-main.css'))
        .pipe(gulp.dest('./dist/css'))

        .pipe($.rename({suffix: '.min'}))
        .pipe($.minifyCss())
        .pipe(gulp.dest('./dist/css'))
        .pipe(reload({stream: true}));
});

/* 制做雪碧图 */
gulp.task('spriter', function () {
    return gulp.src('./dist/css/**/*.css')//比如recharge.css这个样式里面什么都不用改，是你想要合并的图就要引用这个样式。
        .pipe($.cssSpriter({
            // The path and file name of where we will save the sprite sheet
            'spriteSheet': './dist/img/spritesheet.png', //这是雪碧图自动合成的图。
            // Because we don't know where you will end up saving the CSS file at this point in the pipe,
            // we need a litle help identifying where it will be.
            'pathToSpriteSheetFromCSS': '../img/spritesheet.png' //这是在css引用的图片路径
        }))
        .pipe(gulp.dest('./dist/css')); //最后生成出来
});


// 编译 js --> (/dev)
gulp.task('babel-js', function (){
    return gulp
        .src("./src/javascript/!**!/!*.js")
        // .pipe(eslint())
        // .pipe(eslint.format())  // 错误格式化输出
        // .pipe(changed('./dev/scripts'))
        .pipe($.babel())
        .pipe(gulp.dest('./dist/scripts'));
});

/* 编译js */
gulp.task('dev-js-min', function () {
    console.log('dev-js-min');
    return gulp.src("./src/javascript/**/*.js")
        // .pipe(babel())
        .pipe($.concat('gw-main.js'))
        .pipe(gulp.dest('./dist/js'))
        .pipe($.uglify({
            mangle: true,//类型：Boolean 默认：true 是否修改变量名
            compress: true//类型：Boolean 默认：true 是否完全压缩
        }))
        .pipe($.rename({suffix: '.min'}))
        .pipe(gulp.dest("./dist/js"))
        .pipe(reload({stream: true}));
});

/* custome Reporter by jshint */
var customerReporter = map(function (file, cb) {
    if (!file.jshint.success) {
        //打印出错误信息
        // console.log("jshint fail in:" + file.path);
        file.jshint.results.forEach(function (err) {
            if (err) {
                // console.log(err);
                console.log("在 " + file.path + " 文件的第" + err.error.line + " 行的第" + err.error.character + " 列发生错误");
            }
        });
    }
});

/* jshint */
gulp.task('jshint', function () {
    return gulp.src('./src/javascript/**/*.js')
        .pipe($.jshint())
        //.pipe($.jshint.reporter('jshint-stylish'))
        //.pipe($.jshint.reporter('fail'));
        .pipe(customerReporter);
});

/* 移动图片 */
gulp.task('dev-img', function () {
    console.log('dev-img');
    return gulp.src('./src/img/**/*.{png,jpg,gif,ico}')
        .pipe(gulp.dest('./dist/img'))
        .pipe(reload({stream: true}));
});

/* 压缩图片 */
gulp.task('dev-img-min', function () {
    return gulp.src('./dist/img/**/*.{png,jpg,gif,ico}')
        .pipe($.imagemin({
            optimizationLevel: 5, //类型：Number  默认：3  取值范围：0-7（优化等级）
            progressive: true, //类型：Boolean 默认：false 无损压缩jpg图片
            interlaced: true, //类型：Boolean 默认：false 隔行扫描gif进行渲染
            multipass: true //类型：Boolean 默认：false 多次优化svg直到完全优化
        }))
        .pipe(gulp.dest('./dist/img'))
        .pipe(reload({stream: true}));
});

/* 转移libs */
gulp.task('dev-move-libs',function () {
    return gulp.src('./src/libs/**/*')
        .pipe(gulp.dest('./dist/libs'));
});

/* 清空文件夹 */
gulp.task('clean', function () {
    return gulp.src('dist/*', {read: false})
        .pipe($.clean());

});

/* 默认任务 */
gulp.task('default', ['dev-jade', 'dev-img', 'dev-move-libs','dev-css-min', 'dev-js-min']);

/* 打开浏览器运行并监控任务 */
gulp.task('run', ['default'], function () {
    browserSync.init({
        files: ['**'],
        server: {
            baseDir: './dist',// 设置服务器的根目录
            index: 'index.html'// 指定默认打开的文件
        },
        port: 5000// 指定访问服务器的端口号
    });
    gulp.watch('./src/**/*.jade', ['dev-jade']).on('change', reload);
    gulp.watch('./src/javascript/**/*.js', ['dev-js-min']);
    gulp.watch('./src/stylesheet/**/*.less', ['dev-css-min']);
    gulp.watch('./src/img/**/*.{png,jpg,gif,jpeg}', ['dev-img']);
});

/* 打包生产 */
gulp.task('build', ['clean'], function () {
    runSequence('default', 'dev-img-min');
});
gulp.task('zip',function(){
    gulp.src('./dist/**/*')
        .pipe($.zip('dist.zip'))
        .pipe(gulp.dest('./'))
});