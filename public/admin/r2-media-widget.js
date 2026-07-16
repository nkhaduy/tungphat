/* global CMS, createClass, h */
(function () {
  "use strict";

  var API = "/api/admin/media";
  var IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  var ACCEPT = {
    image: IMAGE_TYPES.join(","),
    video: "video/mp4,video/webm",
    document: "application/pdf",
    all: IMAGE_TYPES.concat(["video/mp4", "video/webm", "application/pdf"]).join(",")
  };

  function bytes(value) {
    if (!Number.isFinite(value)) return "—";
    if (value < 1024) return value + " B";
    if (value < 1024 * 1024) return (value / 1024).toFixed(1) + " KiB";
    return (value / 1024 / 1024).toFixed(1) + " MiB";
  }

  function plainValue(value) {
    if (!value) return null;
    if (typeof value === "string") return { legacyUrl: value };
    if (typeof value.get === "function") {
      return {
        key: value.get("key"),
        alt: value.get("alt"),
        name: value.get("name"),
        mimeType: value.get("mimeType"),
        size: value.get("size")
      };
    }
    return value;
  }

  function mediaUrl(value, baseUrl) {
    var media = plainValue(value);
    if (!media) return "";
    if (media.legacyUrl) return media.legacyUrl;
    return baseUrl && media.key ? baseUrl + "/" + media.key : "";
  }

  function canvasBlob(canvas, type, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error("Không thể mã hóa ảnh."));
      }, type, quality);
    });
  }

  async function optimizeImage(file) {
    if (!IMAGE_TYPES.includes(file.type)) return file;
    if (file.size > 25 * 1024 * 1024) throw new Error("Ảnh nguồn vượt 25 MiB.");
    var bitmap;
    try { bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }); }
    catch { bitmap = await createImageBitmap(file); }
    var scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    var canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    var context = canvas.getContext("2d", { alpha: true });
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    var blob = await canvasBlob(canvas, "image/webp", 0.84);
    var stem = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], stem + ".webp", { type: "image/webp", lastModified: Date.now() });
  }

  var R2MediaControl = createClass({
    getInitialState: function () {
      return { items: [], cursor: null, csrf: "", baseUrl: "", busy: false, progress: 0, error: "", before: null, after: null };
    },
    componentDidMount: function () { this.load(false); },
    mediaKind: function () { return this.props.field.get("media_kind") || "all"; },
    load: async function (append) {
      this.setState({ busy: true, error: "" });
      try {
        var query = new URLSearchParams({ limit: "30", mime: this.mediaKind() });
        if (append && this.state.cursor) query.set("cursor", this.state.cursor);
        var response = await fetch(API + "?" + query.toString(), { credentials: "same-origin", headers: { Accept: "application/json" } });
        var result = await response.json();
        if (!response.ok || !result.ok) throw new Error("Không thể tải thư viện R2 (" + (result.code || response.status) + ").");
        this.setState({
          items: append ? this.state.items.concat(result.items) : result.items,
          cursor: result.cursor,
          csrf: result.csrfToken,
          baseUrl: result.baseUrl || "",
          busy: false
        });
        if (result.baseUrl) window.__R2_MEDIA_BASE_URL__ = result.baseUrl;
      } catch (error) { this.setState({ busy: false, error: error.message || "Không thể tải media." }); }
    },
    choose: function (item) {
      this.props.onChange({ key: item.key, name: item.name, mimeType: item.mimeType, size: item.size });
    },
    clear: function () { this.props.onChange(null); },
    upload: async function (event) {
      var original = event.target.files && event.target.files[0];
      event.target.value = "";
      if (!original) return;
      this.setState({ busy: true, progress: 0, error: "", before: original.size, after: null });
      try {
        var uploadFile = IMAGE_TYPES.includes(original.type) ? await optimizeImage(original) : original;
        this.setState({ after: uploadFile.size });
        var result = await this.sendFile(uploadFile);
        this.setState({ busy: false, progress: 100, items: [result.media].concat(this.state.items) });
        this.choose(result.media);
      } catch (error) { this.setState({ busy: false, error: error.message || "Upload thất bại." }); }
    },
    sendFile: function (file) {
      return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", API + "/upload");
        xhr.withCredentials = true;
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.setRequestHeader("X-Media-Filename", encodeURIComponent(file.name));
        xhr.setRequestHeader("X-CSRF-Token", self.state.csrf);
        xhr.upload.onprogress = (event) => { if (event.lengthComputable) this.setState({ progress: Math.round(event.loaded / event.total * 100) }); };
        xhr.onerror = function () { reject(new Error("Mất kết nối khi upload.")); };
        xhr.onload = function () {
          var result;
          try { result = JSON.parse(xhr.responseText); } catch { return reject(new Error("Phản hồi upload không hợp lệ.")); }
          if (xhr.status < 200 || xhr.status >= 300 || !result.ok) return reject(new Error("Upload bị từ chối (" + (result.code || xhr.status) + ")."));
          resolve(result);
        };
        xhr.send(file);
      });
    },
    remove: async function (item, event) {
      event.preventDefault();
      event.stopPropagation();
      if (!window.confirm("Chuyển media này vào trash?\n" + item.key)) return;
      this.setState({ busy: true, error: "" });
      try {
        var body = JSON.stringify({ key: item.key, confirmation: item.key });
        var response = await fetch(API + "/delete", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-CSRF-Token": this.state.csrf }, body: body });
        var result = await response.json();
        if (!response.ok || !result.ok) throw new Error("Không thể xóa media (" + (result.code || response.status) + ").");
        this.setState({ busy: false, items: this.state.items.filter(function (candidate) { return candidate.key !== item.key; }) });
        var selected = plainValue(this.props.value);
        if (selected && selected.key === item.key) this.clear();
      } catch (error) { this.setState({ busy: false, error: error.message || "Xóa thất bại." }); }
    },
    render: function () {
      var selected = plainValue(this.props.value);
      var selectedUrl = mediaUrl(selected, this.state.baseUrl);
      var accept = ACCEPT[this.mediaKind()] || ACCEPT.all;
      return h("div", { className: "r2-media-widget" },
        h("div", { className: "r2-media-actions" },
          h("label", { className: "r2-media-upload" }, this.state.busy ? "Đang xử lý…" : "Tối ưu và upload R2", h("input", { type: "file", accept: accept, disabled: this.state.busy, onChange: this.upload, hidden: true })),
          selected ? h("button", { type: "button", onClick: this.clear, disabled: this.state.busy }, "Bỏ chọn") : null
        ),
        this.state.before !== null ? h("p", { className: "r2-media-stats" }, "Dung lượng: " + bytes(this.state.before) + " → " + (this.state.after === null ? "đang tối ưu" : bytes(this.state.after)) + (this.state.progress ? " · upload " + this.state.progress + "%" : "")) : null,
        this.state.error ? h("p", { className: "r2-media-error", role: "alert" }, this.state.error) : null,
        selected ? h("div", { className: "r2-media-selected" },
          selectedUrl && ((selected.mimeType || "").startsWith("image/") || selected.legacyUrl) ? h("img", { src: selectedUrl, alt: selected.alt || "Media đã chọn" }) : null,
          h("code", null, selected.key || selected.legacyUrl),
          this.props.field.get("with_alt") && !selected.legacyUrl ? h("label", null, "Alt text", h("input", { type: "text", value: selected.alt || "", maxLength: 180, onChange: (event) => { this.props.onChange(Object.assign({}, selected, { alt: event.target.value })); } })) : null
        ) : null,
        h("div", { className: "r2-media-grid" }, this.state.items.map((item) => {
          return h("button", { type: "button", key: item.key, className: selected && selected.key === item.key ? "is-selected" : "", onClick: () => { this.choose(item); } },
            item.url && item.mimeType.startsWith("image/") ? h("img", { src: item.url, alt: "" }) : h("span", { className: "r2-media-file" }, item.mimeType === "application/pdf" ? "PDF" : "MEDIA"),
            h("span", { title: item.key }, item.name),
            h("small", null, bytes(item.size)),
            h("span", { role: "button", tabIndex: 0, className: "r2-media-delete", onClick: (event) => { this.remove(item, event); } }, "Trash")
          );
        })),
        this.state.cursor ? h("button", { type: "button", onClick: () => { this.load(true); }, disabled: this.state.busy }, "Tải thêm") : null
      );
    }
  });

  function R2MediaPreview(props) {
    var value = plainValue(props.value);
    if (!value) return h("span", null, "Chưa chọn media");
    return h("code", null, value.key || value.legacyUrl);
  }

  CMS.registerWidget("r2-media", R2MediaControl, R2MediaPreview);
})();
