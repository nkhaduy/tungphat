<?php
if (!defined('ABSPATH')) exit;
add_filter('locale', function($locale) { return is_admin() ? 'vi' : $locale; });
add_action('admin_menu', function () {
    add_dashboard_page('Quản lý bài viết', 'Tổng quan bài viết', 'edit_posts', 'tungphat-editorial', 'tp_editorial_dashboard');
    add_menu_page('Hướng dẫn biên tập', 'Hướng dẫn', 'edit_posts', 'tungphat-guide', 'tp_editorial_guide', 'dashicons-editor-help', 26);
    if (!current_user_can('manage_options')) {
        remove_menu_page('index.php'); remove_menu_page('edit-comments.php');
        remove_menu_page('edit.php?post_type=page'); remove_menu_page('tools.php');
        add_menu_page('Quản lý bài viết', 'Tổng quan', 'edit_posts', 'tungphat-editorial-home', 'tp_editorial_dashboard', 'dashicons-dashboard', 2);
    }
});
add_action('load-index.php', function () {
    if (current_user_can('edit_posts') && !current_user_can('manage_options')) { wp_safe_redirect(admin_url('admin.php?page=tungphat-editorial-home')); exit; }
    if (current_user_can('manage_options') && !isset($_GET['wp-dashboard'])) { wp_safe_redirect(admin_url('index.php?page=tungphat-editorial')); exit; }
});
add_action('admin_enqueue_scripts', function () {
    wp_enqueue_style('tp-editorial', content_url('mu-plugins/tungphat-editorial/workspace.css'), [], '0.1.0');
});
add_action('add_meta_boxes_post', function () { add_meta_box('tp-seo', 'Thông tin SEO', 'tp_seo_box', 'post', 'side', 'default'); });
// Expose only these public editorial fields; WordPress controls post visibility.
add_action('rest_api_init', function () {
    register_rest_field('post', 'tungphat_seo', [
        'get_callback' => function ($post) {
            $id = (int) $post['id'];
            if (get_post_status($id) !== 'publish' && !current_user_can('edit_post', $id)) return null;
            return ['title' => (string) get_post_meta($id, '_tp_seo_title', true), 'description' => (string) get_post_meta($id, '_tp_seo_description', true), 'noindex' => get_post_meta($id, '_tp_seo_noindex', true) === '1'];
        },
        'schema' => ['type' => 'object', 'context' => ['view', 'edit'], 'properties' => ['title' => ['type' => 'string'], 'description' => ['type' => 'string'], 'noindex' => ['type' => 'boolean']]],
    ]);
});
function tp_seo_box($post) {
    wp_nonce_field('tp_save_seo', 'tp_seo_nonce');
    echo '<p><label for="tp_seo_title">Tiêu đề SEO</label><input class="widefat" id="tp_seo_title" name="tp_seo_title" value="' . esc_attr(get_post_meta($post->ID, '_tp_seo_title', true)) . '"></p>';
    echo '<p><label><input type="checkbox" name="tp_seo_noindex" value="1" ' . checked(get_post_meta($post->ID, '_tp_seo_noindex', true), '1', false) . '> Không lập chỉ mục tìm kiếm</label></p>';
    echo '<p><label for="tp_seo_description">Mô tả SEO</label><textarea class="widefat" rows="4" id="tp_seo_description" name="tp_seo_description">' . esc_textarea(get_post_meta($post->ID, '_tp_seo_description', true)) . '</textarea></p><p>Thông tin lưu cùng bài viết. Bản kết nối website cần hỗ trợ các trường này trước khi sử dụng để xuất bản.</p>';
}
add_action('save_post_post', function ($id) {
    if (!isset($_POST['tp_seo_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['tp_seo_nonce'])), 'tp_save_seo') || !current_user_can('edit_post', $id) || wp_is_post_revision($id)) return;
    foreach (['tp_seo_title', 'tp_seo_description'] as $key) if (isset($_POST[$key])) update_post_meta($id, '_' . $key, sanitize_text_field(wp_unslash($_POST[$key])));
    update_post_meta($id, '_tp_seo_noindex', isset($_POST['tp_seo_noindex']) ? '1' : '0');
});
function tp_editorial_dashboard() {
    if (!current_user_can('edit_posts')) wp_die('Không có quyền truy cập.');
    $status = isset($_GET['tp_status']) ? sanitize_key(wp_unslash($_GET['tp_status'])) : '';
    if (!in_array($status, ['publish','draft','pending','future'], true)) $status = '';
    $search = isset($_GET['tp_search']) ? sanitize_text_field(wp_unslash($_GET['tp_search'])) : '';
    $args = ['post_type'=>'post','post_status'=>$status ?: ['publish','draft','pending','future','private'], 'posts_per_page'=>20, 'orderby'=>'modified','order'=>'DESC','s'=>$search];
    if (!current_user_can('edit_others_posts')) $args['author'] = get_current_user_id();
    $posts = new WP_Query($args); $counts = wp_count_posts('post', 'readable');
    $base = admin_url(current_user_can('manage_options') ? 'index.php?page=tungphat-editorial' : 'admin.php?page=tungphat-editorial-home');
    echo '<div class="wrap tp-workspace"><div class="tp-header"><div><p class="tp-eyebrow">TÙNG PHÁT / BIÊN TẬP</p><h1>Quản lý bài viết</h1><p>Soạn thảo, quản lý và xuất bản nội dung website.</p></div><a class="tp-primary" href="'.esc_url(admin_url('post-new.php')).'">Viết bài mới <span aria-hidden="true">→</span></a></div>';
    echo '<div class="tp-counts">'; foreach (['publish'=>'Đã đăng','draft'=>'Bản nháp','pending'=>'Chờ xuất bản','future'=>'Lên lịch'] as $key=>$label) echo '<a href="'.esc_url(add_query_arg('tp_status',$key,$base)).'"><span>'.esc_html($label).'</span><strong>'.esc_html((string)($counts->$key ?? 0)).'</strong></a>'; echo '</div>';
    echo '<section class="tp-list"><div class="tp-list-heading"><div><h2>Bài viết gần đây</h2><p>Những bài được cập nhật gần nhất.</p></div><a href="'.esc_url(admin_url('edit.php')).'">Xem tất cả bài viết →</a></div>';
    echo '<form method="get" class="tp-filter"><input type="hidden" name="page" value="'.esc_attr(current_user_can('manage_options')?'tungphat-editorial':'tungphat-editorial-home').'"><label class="screen-reader-text" for="tp-search">Tìm bài viết</label><input id="tp-search" name="tp_search" placeholder="Tìm theo tiêu đề hoặc nội dung" value="'.esc_attr($search).'"><label class="screen-reader-text" for="tp-status">Trạng thái</label><select id="tp-status" name="tp_status"><option value="">Mọi trạng thái</option>';
    foreach (['publish'=>'Đã đăng','draft'=>'Bản nháp','pending'=>'Chờ xuất bản','future'=>'Lên lịch'] as $key=>$label) echo '<option value="'.esc_attr($key).'" '.selected($status,$key,false).'>'.esc_html($label).'</option>';
    echo '</select><button class="button">Lọc</button></form><div class="tp-table-scroll"><table class="tp-table"><thead><tr><th>Bài viết</th><th>Trạng thái</th><th>Cập nhật</th><th>Chuyên mục</th><th>Thao tác</th></tr></thead><tbody>';
    $labels=['publish'=>'Đã đăng','draft'=>'Bản nháp','pending'=>'Chờ xuất bản','future'=>'Lên lịch','private'=>'Riêng tư'];
    foreach ($posts->posts as $post) { $cats = get_the_category($post->ID); $edit = get_edit_post_link($post->ID); $view = $post->post_status === 'publish' ? get_permalink($post->ID) : (tp_preview_is_local() && current_user_can('edit_post', $post->ID) ? 'http://127.0.0.1:4187/preview/' . (int) $post->ID : get_preview_post_link($post)); echo '<tr><td><a class="tp-post-title" href="'.esc_url($edit).'">'.esc_html(get_the_title($post) ?: '(Chưa có tiêu đề)').'</a></td><td>'.esc_html($labels[$post->post_status] ?? $post->post_status).'</td><td>'.esc_html(get_the_modified_date('d/m/Y', $post)).'</td><td>'.esc_html(implode(', ', wp_list_pluck($cats, 'name')) ?: '—').'</td><td><a href="'.esc_url($edit).'">Chỉnh sửa</a> · <a href="'.esc_url($view).'">Xem</a></td></tr>'; }
    if (!$posts->have_posts()) echo '<tr><td colspan="5">Chưa có bài viết phù hợp.</td></tr>';
    echo '</tbody></table></div></section><p class="tp-foot">Cần hỗ trợ? <a href="'.esc_url(admin_url('admin.php?page=tungphat-guide')).'">Xem hướng dẫn biên tập</a>.</p></div>';
}
function tp_editorial_guide() { echo '<div class="wrap tp-workspace tp-guide"><p class="tp-eyebrow">TÙNG PHÁT / HƯỚNG DẪN</p><h1>Viết và quản lý bài viết</h1><ol><li><strong>Tạo bài:</strong> Chọn “Viết bài mới”, nhập tiêu đề và nội dung theo từng khối.</li><li><strong>Thêm ảnh hoặc bảng:</strong> Dùng nút thêm khối; chọn Ảnh hoặc Bảng. Với ảnh, điền văn bản thay thế và chú thích phù hợp.</li><li><strong>Ảnh đại diện và chuyên mục:</strong> Mở phần cài đặt bài viết ở cạnh vùng soạn thảo để chọn ảnh và chuyên mục.</li><li><strong>SEO:</strong> Điền tiêu đề và mô tả trong mục Thông tin SEO. Các trường này chưa tự đồng bộ với website.</li><li><strong>Lưu và xuất bản:</strong> Lưu nháp để tiếp tục sau; kiểm tra nội dung trước khi xuất bản. Lưu nháp rồi chọn “Xem trước trên website” trong trình soạn thảo để kiểm tra nội dung đã lưu.</li></ol></div>'; }

// The preview bridge exists only on the local Playground origin. Never use
// Playground's implicit current user: validate the actual browser cookie.
function tp_preview_is_local() {
    return untrailingslashit(home_url()) === 'http://127.0.0.1:9400';
}
function tp_preview_authorized($request) {
    if (!tp_preview_is_local() || empty($_COOKIE[LOGGED_IN_COOKIE])) return false;
    $user_id = wp_validate_auth_cookie(wp_unslash($_COOKIE[LOGGED_IN_COOKIE]), 'logged_in');
    $post = get_post((int) $request['id']);
    return $user_id && $post && $post->post_type === 'post' && !in_array($post->post_status, ['trash', 'auto-draft', 'inherit'], true) && user_can($user_id, 'edit_post', $post->ID);
}
add_action('rest_api_init', function () {
    if (!tp_preview_is_local()) return;
    register_rest_route('tungphat/v1', '/preview/(?P<id>[1-9][0-9]*)', [
        'methods' => 'GET',
        'permission_callback' => 'tp_preview_authorized',
        'callback' => function ($request) {
            $post = get_post((int) $request['id']);
            $image_id = get_post_thumbnail_id($post);
            $image = $image_id ? wp_get_attachment_image_url($image_id, 'full') : '';
            $categories = get_the_category($post->ID);
            return rest_ensure_response([
                'id' => $post->ID, 'slug' => $post->post_name ?: 'draft-' . $post->ID,
                'title' => wp_specialchars_decode(wp_strip_all_tags(get_the_title($post)), ENT_QUOTES), 'excerpt' => wp_specialchars_decode(wp_strip_all_tags(get_the_excerpt($post)), ENT_QUOTES),
                'content' => apply_filters('the_content', $post->post_content),
                'publishedAt' => get_the_date('Y-m-d', $post), 'updatedAt' => get_the_modified_date('Y-m-d', $post),
                'author' => get_the_author_meta('display_name', $post->post_author),
                'category' => $categories ? $categories[0]->name : '',
                'featuredImage' => $image ?: '', 'featuredImageAlt' => $image_id ? get_post_meta($image_id, '_wp_attachment_image_alt', true) : '',
            ]);
        },
    ]);
});
add_filter('rest_pre_serve_request', function ($served, $result, $request) {
    if (strpos($request->get_route(), '/tungphat/v1/preview/') === 0) {
        header('Cache-Control: private, no-store, max-age=0');
        header('X-Robots-Tag: noindex, nofollow, noarchive');
    }
    return $served;
}, 10, 3);
add_action('add_meta_boxes_post', function () {
    if (tp_preview_is_local()) add_meta_box('tp-site-preview', 'Xem trước website', function ($post) {
        if (!current_user_can('edit_post', $post->ID)) return;
        $url = 'http://127.0.0.1:4187/preview/' . (int) $post->ID;
        echo '<p>Lưu bản nháp trước khi xem. Bản xem trước hiển thị nội dung đã lưu.</p><p><a class="button" target="_blank" rel="noopener noreferrer" href="' . esc_url($url) . '">Xem trước trên website</a></p>';
    }, 'post', 'side');
});

// Gutenberg derives draft preview URLs from the REST edit-context link rather
// than preview_post_link. Limit this override to authorized local editors; the
// public REST representation and production site keep their normal permalinks.
add_filter('rest_prepare_post', function ($response, $post, $request) {
    if (tp_preview_is_local() && $request->get_param('context') === 'edit' && $post->post_status !== 'publish' && current_user_can('edit_post', $post->ID)) {
        $data = $response->get_data();
        $data['link'] = 'http://127.0.0.1:4187/preview/' . (int) $post->ID;
        $response->set_data($data);
    }
    return $response;
}, 10, 3);
add_filter('preview_post_link', function ($url, $post) {
    if (tp_preview_is_local() && $post && $post->post_type === 'post' && current_user_can('edit_post', $post->ID)) {
        return 'http://127.0.0.1:4187/preview/' . (int) $post->ID;
    }
    return $url;
}, 10, 2);
