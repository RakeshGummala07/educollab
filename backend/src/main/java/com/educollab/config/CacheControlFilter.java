// CacheControlFilter.java
package com.educollab.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class CacheControlFilter implements Filter {

  @Override
  public void doFilter(ServletRequest request, ServletResponse response,
                       FilterChain chain) throws IOException, ServletException {

    HttpServletResponse httpResponse = (HttpServletResponse) response;
    HttpServletRequest  httpRequest  = (HttpServletRequest)  request;

    String path = httpRequest.getRequestURI();

    httpResponse.setHeader("Expires", null);

    if (path.startsWith("/api/")) {
      // API responses — no cache
      httpResponse.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      httpResponse.setHeader("Pragma", "no-cache");
    } else if (path.matches(".*\\.(js|css|png|jpg|svg|ico|woff2?)$")) {
      // Static assets — cache with hash busting
      httpResponse.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      // HTML — always revalidate
      httpResponse.setHeader("Cache-Control", "no-cache, must-revalidate");
    }

    chain.doFilter(request, response);
  }
}