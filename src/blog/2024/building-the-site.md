---
title: Building the site
summary: Quick notes on the creation of the blog
date: 2024-02-06
tags:
  - coding
  - 11ty
  - github
layout: post
---
One thing I have been trying to get better at over the past 6 months or so is making notes about everything I learn or try out - this not only helps solidify the knowledge, but allows for me to potentially write things up later, and can be useful when coming back to maintain things later down the line. To that end, here are some quick notes on how I made this site, for future reference.

The main thing in mind when it came to designing and creating this site was simplicity; I am not the best at finishing side projects I start, so I knew if I got too bogged down in complexity I would likely just give up. To that end, I wanted a statically generated blog that would be easy to update and maintain, and could be hosted for free on GitHub pages.

In stepped [11ty](https://www.11ty.dev) - this is an SSG that I had heard about from my father, and seemed to be just what I needed. I found a basic blog template that I liked the look of called [Eleventy Duo](https://github.com/yinkakun/eleventy-duo) and got to work tweaking what they had to suit my needs.

I set up the site folder inside an [Obsidian](https://obsidian.md/) workspace; in fact, it was reading someone else's notes page published via the paid Obsidian Publish service that spurred me on to set up a site in the first place. Whilst I had previously (and still do) often use [Notion](https://www.notion.so/) for my note taking, I thought I could try out an alternative at the same as setting up the site.

The code for my version of the site can be found on [GitHub](https://github.com/JamesErrington/jameserrington.github.io), but it is mostly just small style changes and cutting some features out that I didn't feel I needed right now. Using the 11ty cli app I am able to serve the site locally for development purposes, which made it pretty easy to quickly get a working blog up and running, with notes from Obsidian being automatically transformed into styled posts with pagination and tagging.

Combining the JS, Markdown, Nunjucks templating and HTML needed to make the site was fairly straightforward, with the exception of a period where I was finding extra `<p>` tags being inserted by the for loops - after some searching around with little success, I eventually found the solution to be needing to use the {% raw %}`{%- -%}`{% endraw %}	syntax. I have never been a massive fan of these styles of templating language, but they just about do the job for these use cases.

The main point of frustration came when trying to publish the site beyond localhost. I knew I wanted to use GitHub pages since I am already well embedded in the GitHub ecosystem, and the simplicity of being able to push the changes via Git and see the site reload was very attractive. However, this required getting my head around how publishing works with GitHub actions. The default setting is to publish from a branch, but I needed to push via an action, which meant writing the dreaded workflow file.

I have some experience trying to write these workflows, and it has never been fun. Versions seem to change all the time, making tutorial pages quickly outdated, and bugs hard to track down. This time round, I had my first two workflow attempts time out before I found I was requesting an out of date Ubuntu version. Then I ran across permissions issues, which took another 4 runs of the workflow to solve as I tried switching between branches and settings. Eventually I had something that ran, but as I did I found an updated guide explaining how I really should have split the workflow steps up - so a final rewrite of the file, and pray it holds up.

Well there we are - a brain dump on what I did to set the site up. Perhaps some of this may come in handy in the future, but even if not it serves as a good benchmark of my knowledge at this point to look back on.