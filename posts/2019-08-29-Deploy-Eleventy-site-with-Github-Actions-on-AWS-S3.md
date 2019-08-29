---
title: Deploy Eleventy site with Github Actions on AWS S3
date: 2019-08-29
layout: post.njk
tags: post
---

![gh-actions-working.png](/assets/images/posts/eleventy-github-actions-aws/gh-actions-working.png)

I [finally managed](https://twitter.com/christian_fei/status/1167164272096550912) to get the deployment of an [eleventy](https://www.11ty.io) (namely this one) and sync with AWS S3, where this blog is hosted.

Additionally you can put in a small script that purges [cloudflare's](https://www.cloudflare.com) cache too.


## Setting up the Github Actions workflow

create a file in `.github/workflows`:

```
mkdir .github/workflows
touch .github/workflows/main.yml
```

The contents of `.github/workflows/main.yml` should be:

```
name: name this build as you like
on: [push]
jobs:
  build_deploy:
    runs-on: ubuntu-18.04
    steps:
      - uses: actions/checkout@master
      - name: up
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          npx @11ty/eleventy
          aws s3 cp \
            --recursive \
            --acl public-read \
            --region eu-central-1 \ # change it
            ./_site/ [s3://bucket_name] # change it
```

additionally set two **Secrets** in the repository settings on GitHub

![gh-actions-github-secrets.png](/assets/images/posts/eleventy-github-actions-aws/gh-actions-github-secrets.png)

Now you should be all set, and your eleventy blog gets deployed to AWS with GitHub Actions on every push.


## update

this blog post was deployed with this exact workflow, so meta

![gh-actions-deploy-blog-post.png](/assets/images/posts/eleventy-github-actions-aws/gh-actions-deploy-blog-post.png)

---

A few highlights of the workflow:

![gh-actions-build-deploy.png](/assets/images/posts/eleventy-github-actions-aws/gh-actions-build-deploy.png)

![gh-actions-cloudflare-purge-cache.png](/assets/images/posts/eleventy-github-actions-aws/gh-actions-cloudflare-purge-cache.png)