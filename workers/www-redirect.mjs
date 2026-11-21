export default {
  fetch(request) {
    const target = new URL(request.url);
    target.hostname = "gotungphat.com";
    target.protocol = "https:";
    return Response.redirect(target.toString(), 301);
  },
};
