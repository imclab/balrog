var handlebars = require('handlebars')
var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')
var cheerio = require('cheerio')

var generateTemplates = require('./generate-templates.js')
var chooseTemplate = require('./choose-template')

var writeFile = fs.writeFileSync.bind(fs)

module.exports = function makePages(filesAndContent, opts) { // add back callback
    
  var posts = separatePosts(filesAndContent)
  var totalPosts = posts.length
  var totalPages = Math.ceil(totalPosts / opts.pagination)
  var ppp = ""
  
  if (!opts.partialsDir) {
    ppp = totalPosts
  } else {
    ppp = opts.pagination || 5
  }
  
  generatePages(totalPages, opts, posts)

  function generatePages(totalPages, opts, posts) {
        
      generateTemplates(opts, function (err, tpl) {
        if (err) return console.log(err) // callback(err)
      
        mkdirp('site/blog/page/', function() {
        
          for (var i = 0; i < totalPages; i++) {
            if (ppp === totalPosts && i === 1) return
            
            var pagesPosts = []
            pagesPosts.push(posts.slice((i * ppp), ((i + 1) * ppp)))
            var content = { "posts": pagesPosts.pop(), "page": i, "previous": preURL(i), "next": nextURL(i) }
            var pagePath = determinePage(i)
            var template = chooseTemplate(pagePath, opts.templates) || 'main'
            var htmlOutput = tpl.templates[template](content)
            
            if (opts.partialsDir) {
              $ = cheerio.load(htmlOutput)
              if (i === 0) $('a.turn-previous').addClass('end-of-pages').html()
              if (i === totalPages - 1) $('a.turn-next').addClass('end-of-pages').html()
              htmlOutput = $.html()
            }
          
            fs.writeFile('site/blog/' + pagePath, htmlOutput, function (err) {
              if (err) throw err
            })
          }
        })
      })
    }

}

function preURL(currentPage){
  if (currentPage === 1) return 'index.html'
  else return 'page/' + (currentPage - 1)
}

function nextURL(currentPage){
  return currentPage + 1
 }

function determinePage(currentPage) {
  var pagePath = ""
  if (currentPage === 0) pagePath = 'index.html'
  else pagePath = 'page/' + (currentPage) + '.html'
  return pagePath
}

function separatePosts (filesAndContent) {
  var posts = []
  filesAndContent.forEach(function(item) {
    if (item.output.match('/blog/'))
      posts.push(item)
  })
  // sort by date
  posts.sort(function(a,b) {
    a = a.content.date
    b = b.content.date
    return (a === b) ? 0 : a > b ? -1 : 1;
  })
  return posts.reverse()
}

// prob don't need these any more

function onlyContent(posts) {
  var onlypostcontent = []
  posts.forEach(function(post) {
    onlypostcontent.push(post.content.content)
  })
  return onlypostcontent
}

function sortPosts(posts) {
  posts.sort(function(a,b) {
    a = new Date(a.date)
    b = new Date(b.date)
    return (a === b) ? 0 : a > b ? -1 : 1;
  })
}

// notes: 
// var content = { "content": pagesPosts.pop() }
// doing it this way requires a template with 
// {{#content}}{{{content}}}{{/content}} but allows you to 
// style between/around posts
// you must tripple {{{}}} to escape the HTML!