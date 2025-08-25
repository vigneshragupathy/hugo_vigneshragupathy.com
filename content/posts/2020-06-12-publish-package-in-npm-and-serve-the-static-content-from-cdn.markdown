---
#layout: post
title: Publish package in NPM and serve the static content from CDN
date: '2020-06-12 12:15:00'
tags:
- linux
- opensource
author: Vignesh Ragupathy
comments: true
image: /content/images/cover/npm.jpg
---

![](/content/images/cover/npm.jpg)
*Photo by [Vignesh Ragupathy](https://photography.vikki.in/vikki-photography-budapest-3){:target="_blank"}.*

I have been utilizing AWS to host my personal blog for almost 3 years now. Originally my blog was hosted in WordPress and then I migrated to [ghost](https://ghost.org/){:target="_blank"}. It's been 2 years now in ghost and I thought of exploring a new hosting option which should be free, supports custom domain name and free [SSL](https://letsencrypt.org/){:target="_blank"}.

[Jekyll](https://jekyllrb.com/){:target="_blank"} is a ruby based static blog generator and it has an advantage of free hosting in GitHub. The letsencrypt SSL certificate is also provided by GitHub for my custom domain so i don’t have to worry about managing it.

I also created a separate [website](https://tools.vikki.in){:target="_blank"} to showcase my open-source tools and I can use the same AWS instance for hosting it. It is a Django application which uses more memory/CPU, so i can run it in a dedicated instance instead of running the ghost and Django together.

One of the challenges in a Django application is hosting your static content. Django recommends using a proxy server like Nginx to serve its static content.

I use my nginx proxy to serve the static content. But due to performance reason , i started to explore the free CDN to serve my static content

Below is the nginx configuration snippet for mapping static content.

{% highlight console %}
location /static/ {
        root /tools.vikki.in/static;
    }
{% endhighlight %}

After doing some research I chose to utilize unpkg or jsdelivr for my site.

> unpkg and jsdelivr are global CDN and they can be used to deliver any packages hosted in NPM

[unpkg](https://unpkg.com/){:target="_blank"} and [jsdelivr](https://www.jsdelivr.com/){:target="_blank"} both provides CDN for the content hosted in NPM.
So first we should have the static content published in [NPM](https://www.npmjs.com/){:target="_blank"}.

## NPM Package creation

### 1. Create the directory for adding packages for NPM

{% highlight console %}
mkdir npm
mkdir npm/dist
cd npm
{% endhighlight %}

### 2. Create a package.json file for your package

{% highlight console %}
npm init
{% endhighlight %}

{% highlight console %}
This utility will walk you through creating a package.json file.
It only covers the most common items, and tries to guess sensible defaults.

See `npm help json` for definitive documentation on these fields
and exactly what they do.

Use `npm install pkg` afterwards to install a package and
save it as a dependency in the package.json file.

Press ^C at any time to quit.
package name: (npm) vikki-tools
version: (1.0.0) 1.0.7
description: Libraries for https://tools.vikki.in
entry point: (index.js) dist/index.js
test command:
git repository: https://github.com/vignesh88/tools.git
keywords: vikki, tools
author: Vignesh Ragupathy
license: (ISC)
About to write to /home/vikki/npm/package.json:

{% endhighlight %}
{% highlight json linenos %}
{
  "name": "vikki-tools",
  "version": "1.0.7",
  "description": "Libraries for https://tools.vikki.in",
  "main": "dist/index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/vignesh88/tools.git"
  },
  "keywords": [
    "vikki",
    "tools"
  ],
  "author": "Vignesh Ragupathy",
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/vignesh88/tools/issues"
  },
  "homepage": "https://github.com/vignesh88/tools#readme"
}
{% endhighlight %}
{% highlight console %}
Is this OK? (yes) yes
{% endhighlight %}


### 3. Create a index.js

I added a javascript function that will be used to copy text to clipboard.

{% highlight console %}
vim dist/index.js
{% endhighlight %}

{% highlight javascript linenos %}
function copyToClipboard(x,y) {
    if( document.getElementById(x).value) {
        data_2_copy = document.getElementById(x).value;
    } else {
        data_2_copy = document.getElementById(x).innerText;
    }

    var e = document.createElement("textarea");
    e.style.opacity = "0", e.style.position = "fixed", e.textContent = data_2_copy;
    var t = document.getElementsByTagName("body")[0];
    t.appendChild(e), e.select(), document.execCommand("copy"), t.removeChild(e), $(y).show(), setTimeout((function () {
        $(y).hide()
    }), 1e3)
}
{% endhighlight %}

### 4. Copy all your static content to dist directory

Now lets copy all our static content to the <mark>dist</mark> directory.
I have various css,images,javascript that will be used in various app inside my django application.

Below are the files which i copied.

{% highlight console %}
tree .
.
├── dist
│   ├── admin
│   │   ├── css
│   │   │   ├── autocomplete.css
│   │   │   ├── base.css
│   ├── geoip
│   │   ├── css
│   │   │   ├── geoip_dark.css
│   │   │   └── geoip_light.css
│   │   └── js
│   │       └── geoip.js
│   ├── index.js
│   └── password_generator
│       ├── css
│       │   ├── password_generator_dark.css
│       │   └── password_generator_light.css
│       ├── img
│       │   ├── copy-full.svg
│       │   └── regenerate.svg
│       └── js
│           └── password_generator.js
├── package.json
└── README.md
{% endhighlight %}

### 5. Publish you static content as package in NPM

Now we are all set, let's connect to NPM and publish our package.

> You should already have an account in NPM to publish.

{% highlight console %}
npm login
Username: r_vignesh
Password: 
Email: (this IS public) me@vikki.in
Logged in as r_vignesh on https://registry.npmjs.org/.
{% endhighlight %}


{% highlight console %}
npm publish

npm notice
npm notice package: vikki-tools@1.0.7
npm notice === Tarball Contents ===
npm notice 1.1kB   dist/admin/img/LICENSE
npm notice 8.4kB   dist/admin/css/autocomplete.css
npm notice 16.4kB  dist/admin/css/base.css
npm notice 698B    dist/base64/css/base64_dark.css
npm notice 159B    dist/base64/css/base64_light.css
npm notice 85.9kB  dist/admin/fonts/Roboto-Regular-webfont.woff
npm notice === Tarball Details ===
npm notice name:          vikki-tools
npm notice version:       1.0.7
npm notice package size:  1.1 MB
npm notice unpacked size: 3.9 MB
npm notice shasum:        a9153c3a9bb68bc34d5040d2088a5b95a256e4cc
npm notice integrity:     sha512-zynWl1/pL0Wvk[...]k3yhkCzBz7+0A==
npm notice total files:   188
npm notice
+ vikki-tools@1.0.7
{% endhighlight %}

That's it. Now we have the package published in NPM.

> Unpkg and Jsdelivr provide CDN for NPM packages without any configuration.

### 6. Verify published package in NPM

Lets try to access it using unpkg. Open your browser and enter the url in the below format.

<mark>https://unpkg.com/pacakage/</mark>

For using specific version <mark>https://unpkg.com/package@version/:file</mark>

My package name is *vikki-tools* so the format will be [https://unpkg.com/vikki-tools<mark>/</mark>](https://unpkg.com/vikki-tools/){:target="_blank"}.

> The leading <mark> / </mark> at the end of the URL is important.

### Screenshot from browser

![unpkg screenshot](/content/images/2020/screenshot_vikki_tools.jpg)

## Using Unpkg to serve static content in website

We can now load the static content from NPM on our website.

{% highlight html linenos %}
<script src="https://unpkg.com/vikki-tools@1.0.3/dist/index.js"></script>
<link href="https://unpkg.com/vikki-tools@1.0.3/dist/base64/css/base64_dark.css" rel="stylesheet">
{% endhighlight %}

## Using Jsdelivr to serve static content in website

We can also use Jsdelivr instead of unpkg.

{% highlight html linenos %}
<script src="https://cdn.jsdelivr.net/npm/vikki-tools@1.0.3/dist/index.js"></script>
<link href="https://cdn.jsdelivr.net/npm/vikki-tools@1.0.3/dist/base64/css/base64_dark.css" rel="stylesheet">
{% endhighlight %}

## Auto minified version from jsdelivr

Jsdelivr also provides the auto minified version of the CSS and Javascript from NPM.
If you want to use minified version css and js, just add <mark>.min</mark> extension to the filename

{% highlight html linenos %}
<script src="https://cdn.jsdelivr.net/npm/vikki-tools@1.0.3/dist/index.min.js"></script>
<link href="https://cdn.jsdelivr.net/npm/vikki-tools@1.0.3/dist/base64/css/base64_dark.min.css" rel="stylesheet">
{% endhighlight %}

## Script to automatically update the static and CDN URL in Django

For ease, I created a script to automatically update all static content in your template directory in the Django application.

The code is available in the [Github URL](https://github.com/vignesh88/tools/blob/master/vikki_scripts/django_template_static_to_cdn.py){:target="_blank"}

## Demo video



<style>.embed-container { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; } .embed-container iframe, .embed-container object, .embed-container embed { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }</style><div class='embed-container'><iframe src='https://www.youtube.com/embed/PKGLkmzHQH0' frameborder='0' allowfullscreen></iframe></div>

<!--
<object style="width:100%;height:100%;width: 820px; height: 461.25px; float: none; clear: both; margin: 2px auto;" data="https://www.youtube.com/embed/XMSV5J4jxSo">
</object>
<iframe width="560" height="315" src="https://www.youtube.com/embed/XMSV5J4jxSo" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
-->