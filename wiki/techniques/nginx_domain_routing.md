---
title: Nginx Domain Routing
type: techniques
created: 2014-07-12
last_updated: 2014-07-12
related: ["[[Web Architecture Concepts]]", "[[beego]]"]
sources: ["8ed10bae266b"]
---

# Nginx Domain Routing

In July 2014, the subject configured Nginx to route different domains to different back-end applications on a single server.

## Setup

The subject registered `cyeam.tk` through the free domain provider `dot.tk` and created two A records pointing subdomains to the same server IP. Two beego applications were started on different local ports (331 and 8080).

## Configuration

Inside the Nginx configuration, an `if` block inspected `$http_host` and proxied requests to the appropriate port:

```nginx
location / {
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header Host $http_host;

    if ($http_host = "blog.cyeam.tk") {
        proxy_pass http://127.0.0.1:331;
    }

    if ($http_host = "www.cyeam.tk") {
        proxy_pass http://127.0.0.1:8080;
    }

    root html;
    index index.html index.htm;
}
```

Configuration validation and reload were performed with:

```bash
sbin/nginx -t
sbin/nginx -s reload
```

## Follow-up

The setup worked initially but became inaccessible the next day because the domain was not registered with Chinese authorities (MIIT). The subject also noted a security concern: direct access via `domain:port` could bypass Nginx and reach the back-end applications, suggesting that firewall rules should block external access to non-standard ports.
