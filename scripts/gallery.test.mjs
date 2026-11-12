import assert from "node:assert/strict";
import test from "node:test";
import { mergeUniqueById } from "../src/auth/catalog.js";
import {
  GALLERY_CATEGORIES,
  GALLERY_FILTERS,
  GALLERY_SYSTEM_FILTERS,
  PUBLIC_GALLERY_PAGE_SIZE,
  emptyGalleryForm,
  filterGalleryPosts,
  galleryGridRowDividerAfter,
  galleryPostCopy,
  galleryPostHasVideo,
  galleryPostPath,
  homeGalleryPosts,
  publicGalleryFilters,
  sortGalleryPosts,
  storyVideo,
  orderedGalleryImages,
  orderedGalleryMedia,
  storyExcerpt,
  selectIncomingGalleryFiles,
  validateGalleryMedia,
} from "../src/data/gallery.js";
import { tFor } from "../src/i18n/translations.js";
import { facebookVideoHref } from "../src/services/facebookPlayerPool.js";
import { requestFacebookAudiblePlayback } from "../src/services/facebookSdk.js";
import { formFromPost, payloadFromForm } from "../src/data/galleryForm.js";
import {
  galleryDirectVideoPath,
  galleryPosterUrl,
  galleryUploadMime,
  galleryVideoEmbedSrc,
  galleryVideoPreviewSrc,
  hydrateGalleryMedia,
  parseGalleryVideoUrl,
} from "../src/data/galleryVideo.js";

test("gallery filters hide other categories and keep published-looking lists intact", () => {
  const posts = [
    { id: "1", category: "process", title: "A" },
    { id: "2", category: "video", title: "B" },
    { id: "3", category: "art-of-making", title: "C" },
  ];
  assert.equal(filterGalleryPosts(posts, "all").length, 3);
  assert.deepEqual(filterGalleryPosts(posts, "video").map((item) => item.id), []);
  assert.deepEqual(filterGalleryPosts(posts, "art-of-making").map((item) => item.id), ["3"]);
  assert.ok(GALLERY_CATEGORIES.includes("art-of-making"));
  assert.ok(GALLERY_FILTERS.includes("art-of-making"));
  assert.ok(GALLERY_CATEGORIES.includes("process"));
  assert.ok(!GALLERY_CATEGORIES.includes("video"));
  assert.deepEqual(GALLERY_SYSTEM_FILTERS, ["all", "video"]);
});

test("public filters keep ALL and VIDEO then enabled categories by sortOrder", () => {
  const filters = publicGalleryFilters([
    { slug: "finish", sortOrder: 40, isActive: true, translations: { en: { name: "Finish" } } },
    { slug: "process", sortOrder: 10, isActive: true, translations: { en: { name: "Build process" } } },
    { slug: "hidden", sortOrder: 5, isActive: false, translations: { en: { name: "Hidden" } } },
  ]);
  assert.deepEqual(filters.map((item) => item.id), ["all", "video", "process", "finish"]);
});

test("gallery posts sort by display date newest first and keep undated items last", () => {
  const sorted = sortGalleryPosts([
    { id: "old", publishedAt: "2024-01-01T00:00:00.000Z", order: 1 },
    { id: "new", publishedAt: "2026-05-01T00:00:00.000Z", order: 9 },
    { id: "same-b", publishedAt: "2025-06-01T00:00:00.000Z", order: 2 },
    { id: "same-a", publishedAt: "2025-06-01T00:00:00.000Z", order: 1 },
    { id: "none", publishedAt: null, order: 0 },
  ]);
  assert.deepEqual(sorted.map((item) => item.id), ["new", "same-b", "same-a", "old", "none"]);
});

test("gallery posts pin first then display date, with undated items last in each pin group", () => {
  const sorted = sortGalleryPosts([
    { id: "unpinned-new", pin: false, publishedAt: "2026-05-01T00:00:00.000Z" },
    { id: "pinned-old", pin: true, publishedAt: "2024-01-01T00:00:00.000Z" },
    { id: "pinned-none", pin: true, publishedAt: null },
    { id: "unpinned-none", pin: false, publishedAt: null },
    { id: "pinned-new", pin: true, publishedAt: "2026-08-01T00:00:00.000Z" },
  ]);
  assert.deepEqual(sorted.map((item) => item.id), [
    "pinned-new",
    "pinned-old",
    "pinned-none",
    "unpinned-new",
    "unpinned-none",
  ]);
});

test("gallery page size is 12 and SHOW MORE appends unique ids without dropping prior items", () => {
  assert.equal(PUBLIC_GALLERY_PAGE_SIZE, 12);
  const page1 = Array.from({ length: 12 }, (_, index) => ({ id: `g-${index}` }));
  const page2 = [{ id: "g-11" }, { id: "g-12" }, { id: "g-13" }];
  const merged = mergeUniqueById(page1, page2);
  assert.equal(merged.length, 14);
  assert.equal(merged[0].id, "g-0");
  assert.equal(new Set(merged.map((item) => item.id)).size, 14);
});

test("VIDEO tab lists posts by playable media, not category", () => {
  const youtube = {
    id: "yt",
    category: "process",
    media: [{ kind: "video", provider: "youtube", videoId: "cuZ8FmcnON4", sourceUrl: "https://www.youtube.com/watch?v=cuZ8FmcnON4" }],
  };
  const facebook = {
    id: "fb",
    category: "art-of-making",
    media: [{
      kind: "video",
      provider: "facebook",
      sourceUrl: "https://www.facebook.com/reel/1649522569474963",
    }],
  };
  const uploaded = {
    id: "file",
    category: "instruments",
    media: [
      { kind: "image", path: "/uploads/gallery/images/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg" },
      { kind: "video", provider: "upload", path: "/uploads/gallery/videos/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.mp4" },
    ],
  };
  const imageOnly = {
    id: "photo",
    category: "video",
    media: [{ kind: "image", path: "/uploads/gallery/images/cccccccccccccccccccccccccccccccc.jpg" }],
  };
  const finishStill = {
    id: "finish",
    category: "finish",
    media: [{ kind: "image", path: "/uploads/gallery/images/dddddddddddddddddddddddddddddddd.jpg" }],
  };
  const posts = [youtube, facebook, uploaded, imageOnly, finishStill];

  assert.equal(galleryPostHasVideo(youtube), true);
  assert.equal(galleryPostHasVideo(imageOnly), false);
  assert.deepEqual(filterGalleryPosts(posts, "video").map((item) => item.id), ["yt", "fb", "file"]);
  assert.deepEqual(filterGalleryPosts(posts, "process").map((item) => item.id), ["yt"]);
  assert.deepEqual(filterGalleryPosts(posts, "art-of-making").map((item) => item.id), ["fb"]);
  assert.deepEqual(filterGalleryPosts(posts, "instruments").map((item) => item.id), ["file"]);
  assert.deepEqual(filterGalleryPosts(posts, "finish").map((item) => item.id), ["finish"]);
  assert.ok(!filterGalleryPosts(posts, "video").some((item) => item.id === "photo"));
});

test("gallery copy exists in English and Vietnamese", () => {
  assert.equal(tFor("en", "nav.gallery"), "Journal");
  assert.equal(tFor("vi", "nav.gallery"), "Journal");
  assert.equal(tFor("en", "gallery.title"), "Journal");
  assert.equal(tFor("vi", "gallery.title"), "Journal");
  assert.equal(tFor("en", "pages.gallery.title"), "Journal");
  assert.equal(tFor("vi", "pages.gallery.title"), "Journal");
  assert.equal(tFor("en", "gallery.filters.process"), "Build process");
  assert.equal(tFor("vi", "gallery.filters.process"), "Quá trình chế tác");
  assert.equal(tFor("en", "gallery.filters.art-of-making"), "ART OF MAKING");
  assert.equal(tFor("vi", "gallery.filters.art-of-making"), "NGHỆ THUẬT CHẾ TÁC");
  assert.equal(tFor("vi", "gallery.filters.materials"), "Vật liệu & gỗ");
  assert.equal(tFor("en", "gallery.media.unavailable"), "This image could not be loaded.");
  assert.equal(tFor("en", "gallery.video.unsupported"), "This uploaded video cannot play in this browser. Use MP4 (H.264/AAC) if possible.");
  assert.equal(tFor("en", "gallery.add"), "Add New");
  assert.equal(tFor("en", "gallery.form.showAtHome"), "Show on Home");
  assert.equal(tFor("en", "gallery.showMore"), "SHOW MORE");
  assert.equal(tFor("vi", "gallery.showMore"), "THÊM NỘI DUNG");
  assert.equal(tFor("en", "gallery.form.pin"), "Pin on Gallery");
  assert.equal(tFor("vi", "gallery.form.pin"), "Ghim trên trang Gallery");
  assert.equal(tFor("en", "gallery.categories.title"), "Gallery categories");
  assert.equal(tFor("vi", "gallery.categories.add"), "Thêm danh mục");
  assert.equal(tFor("vi", "gallery.form.showAtHome"), "Hiện trên trang chủ");
  assert.equal(tFor("en", "home.artOfMaking.playVideo"), "Play video");
  assert.equal(tFor("vi", "home.artOfMaking.playVideo"), "Phát video");
  assert.equal(tFor("en", "home.artOfMaking.closeVideo"), "Close video");
  assert.equal(tFor("vi", "home.artOfMaking.closeVideo"), "Đóng video");
  assert.equal(tFor("en", "home.artOfMaking.title"), "Artist & Workshop Stories");
  assert.equal(tFor("en", "home.artOfMaking.eyebrow"), "Behind the music & the craft");
  assert.equal(tFor("vi", "home.artOfMaking.title"), "Nghệ sĩ & Câu chuyện xưởng đàn");
  assert.equal(tFor("vi", "home.artOfMaking.eyebrow"), "Âm nhạc & dấu ấn chế tác");
  assert.equal(
    tFor("en", "home.artOfMaking.description"),
    "Stories of artists, music, and craftsmanship — from workshop visits and live sessions to guitar demonstrations, testing, and creative collaborations.",
  );
  assert.equal(
    tFor("vi", "home.artOfMaking.description"),
    "Những câu chuyện về nghệ sĩ, âm nhạc và xưởng chế tác — từ các buổi ghé thăm, biểu diễn, trải nghiệm nhạc cụ đến những hoạt động sáng tạo tại PhanQuan Guitars.",
  );
  assert.equal(tFor("en", "home.featured.title"), "Featured guitars");
  assert.equal(tFor("en", "gallery.errors.TOO_MANY_IMAGES"), "A gallery post can include at most 5 images.");
  assert.equal(tFor("vi", "gallery.errors.TOO_MANY_IMAGES"), "Mỗi bài gallery tối đa 5 ảnh.");
  assert.equal(tFor("en", "gallery.errors.TOO_MANY_VIDEOS"), "A gallery post can include at most 5 videos.");
  assert.equal(tFor("vi", "gallery.errors.TOO_MANY_VIDEOS"), "Mỗi bài gallery tối đa 5 video.");
});

test("Journal grid row dividers sit between rows and never after the last row", () => {
  const after = (count, columns) =>
    Array.from({ length: count }, (_, index) => index).filter((index) =>
      galleryGridRowDividerAfter(index, count, columns),
    );
  assert.deepEqual(after(12, 3), [2, 5, 8]);
  assert.deepEqual(after(10, 3), [2, 5, 8]);
  assert.deepEqual(after(12, 2), [1, 3, 5, 7, 9]);
  assert.deepEqual(after(5, 1), [0, 1, 2, 3]);
  assert.deepEqual(after(1, 3), []);
  assert.deepEqual(after(2, 3), []);
  assert.equal(galleryGridRowDividerAfter(11, 12, 3), false);
});

test("home gallery posts stay on the gallery collection and default off the home section", () => {
  assert.equal(emptyGalleryForm().showAtHome, false);
  assert.equal(emptyGalleryForm().pin, false);
  assert.equal(galleryPostPath("abc123"), "/gallery/abc123");
  const posts = [
    { id: "1", title: "On home", category: "process", showAtHome: true },
    { id: "2", title: "Gallery only", category: "art-of-making", showAtHome: false },
    { id: "3", title: "Legacy" },
  ];
  assert.deepEqual(
    homeGalleryPosts(posts).map((item) => item.id),
    ["1"],
  );
  assert.equal(emptyGalleryForm().category, "process");
  assert.equal(emptyGalleryForm().titleVi, "");
  assert.equal(emptyGalleryForm().titleEn, "");
  const bilingual = {
    id: "bi",
    title: "Tiêu đề cũ",
    excerpt: "Mô tả cũ",
    content: "Nội dung cũ",
    translations: {
      vi: { title: "Tiêu đề VI", excerpt: "Mô tả VI", content: "Nội dung VI" },
      en: { title: "Title EN", excerpt: "Excerpt EN", content: "Content EN" },
    },
  };
  assert.equal(galleryPostCopy(bilingual, "vi").title, "Tiêu đề VI");
  assert.equal(galleryPostCopy(bilingual, "en").title, "Title EN");
  assert.equal(galleryPostCopy(bilingual, "en").excerpt, "Excerpt EN");
  assert.equal(galleryPostCopy({ title: "Chỉ tiếng Việt", excerpt: "Mô tả" }, "en").title, "Chỉ tiếng Việt");
  assert.equal(galleryPostCopy({ title: "Chỉ tiếng Việt", excerpt: "Mô tả" }, "vi").excerpt, "Mô tả");
  const bilingualForm = formFromPost(bilingual);
  assert.equal(bilingualForm.titleVi, "Tiêu đề VI");
  assert.equal(bilingualForm.titleEn, "Title EN");
  const bilingualPayload = payloadFromForm(bilingualForm);
  assert.equal(bilingualPayload.translations.en.content, "Content EN");
  assert.equal(bilingualPayload.title, "Tiêu đề VI");
  const legacyForm = formFromPost({ title: "Bài cũ", excerpt: "Mô tả cũ", content: "Nội dung cũ" });
  assert.equal(legacyForm.titleVi, "Bài cũ");
  assert.equal(legacyForm.titleEn, "");
  assert.equal(payloadFromForm(legacyForm).translations.vi.title, "Bài cũ");
  assert.equal(tFor("en", "gallery.form.localeVi"), "Vietnamese");
  assert.equal(tFor("vi", "gallery.form.localeEn"), "Tiếng Anh");
  assert.equal(storyExcerpt(""), "");
  assert.equal(storyExcerpt("A night in the shop"), "A night in the shop");
  assert.equal(storyExcerpt("https://www.facebook.com/reel/1"), "");
  const withVideo = {
    cover: { id: "img", kind: "image" },
    media: [
      { id: "img", kind: "image" },
      { id: "yt", kind: "video", sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    ],
  };
  assert.equal(storyVideo(withVideo).id, "yt");
  assert.equal(storyVideo({ cover: { id: "img", kind: "image" }, media: [{ id: "img", kind: "image" }] }), null);
});

test("gallery media limits keep five images and five videos and allow mixed posts", () => {
  const images = Array.from({ length: 5 }, (_, index) => ({ id: `i${index}`, kind: "image" }));
  assert.equal(validateGalleryMedia(images), null);
  assert.equal(validateGalleryMedia([...images, { id: "i5", kind: "image" }]), "TOO_MANY_IMAGES");
  assert.equal(validateGalleryMedia([{ id: "v", kind: "video" }]), null);
  const fiveVideos = Array.from({ length: 5 }, (_, index) => ({ id: `v${index}`, kind: "video" }));
  assert.equal(validateGalleryMedia(fiveVideos), null);
  assert.equal(validateGalleryMedia([...fiveVideos, { id: "v5", kind: "video" }]), "TOO_MANY_VIDEOS");
  assert.equal(validateGalleryMedia([{ id: "i", kind: "image" }, { id: "v", kind: "video" }]), null);

  const extra = selectIncomingGalleryFiles(images, [{ type: "image/png" }]);
  assert.equal(extra.files.length, 0);
  assert.equal(extra.code, "TOO_MANY_IMAGES");

  const mixedUpload = selectIncomingGalleryFiles(images.slice(0, 1), [{ type: "video/mp4" }]);
  assert.equal(mixedUpload.files.length, 1);
  assert.equal(mixedUpload.code, null);

  const sixthVideo = selectIncomingGalleryFiles(fiveVideos, [{ type: "video/mp4" }]);
  assert.equal(sixthVideo.files.length, 0);
  assert.equal(sixthVideo.code, "TOO_MANY_VIDEOS");

  const ordered = orderedGalleryImages({
    coverMediaId: "b",
    media: [
      { id: "a", kind: "image" },
      { id: "b", kind: "image" },
      { id: "c", kind: "video" },
    ],
  });
  assert.deepEqual(
    ordered.map((item) => item.id),
    ["b", "a"],
  );

  const orderedMedia = orderedGalleryMedia({
    media: [
      { id: "b", kind: "image", sortOrder: 2 },
      { id: "a", kind: "video", sortOrder: 1 },
    ],
  });
  assert.deepEqual(
    orderedMedia.map((item) => item.id),
    ["a", "b"],
  );
});

test("gallery video URLs accept YouTube, Shorts, Facebook, Vimeo, and reject unsafe values", () => {
  const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  const youtube = parseGalleryVideoUrl(youtubeUrl);
  assert.equal(youtube.ok, true);
  assert.equal(youtube.provider, "youtube");
  assert.equal(youtube.videoId, "dQw4w9WgXcQ");
  assert.equal(youtube.sourceUrl, youtubeUrl);
  assert.equal(galleryVideoEmbedSrc(youtube), "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  assert.equal(
    galleryVideoEmbedSrc(youtube, { autoplay: true }),
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1",
  );
  assert.equal(galleryDirectVideoPath({ kind: "video", ...youtube }), "");

  const shortsUrl = "https://www.youtube.com/shorts/dQw4w9WgXcQ";
  const shorts = parseGalleryVideoUrl(shortsUrl);
  assert.equal(shorts.ok, true);
  assert.equal(shorts.videoId, "dQw4w9WgXcQ");
  assert.equal(shorts.sourceUrl, shortsUrl);

  const short = parseGalleryVideoUrl("https://youtu.be/dQw4w9WgXcQ");
  assert.equal(short.ok, true);
  assert.equal(short.videoId, "dQw4w9WgXcQ");

  const facebookUrl = "https://www.facebook.com/watch/?v=123456789012345";
  const facebook = parseGalleryVideoUrl(facebookUrl);
  assert.equal(facebook.ok, true);
  assert.equal(facebook.provider, "facebook");
  assert.equal(facebook.sourceUrl, facebookUrl);
  assert.match(galleryVideoEmbedSrc(facebook), /facebook\.com\/plugins\/video\.php\?href=/);

  const reelUrl = "https://www.facebook.com/reel/987654321098765";
  const reel = parseGalleryVideoUrl(reelUrl);
  assert.equal(reel.ok, true);
  assert.equal(reel.provider, "facebook");
  assert.equal(reel.sourceUrl, reelUrl);
  assert.equal(reel.videoId, "987654321098765");

  const pageVideoUrl = "https://www.facebook.com/PhanQuanGuitars/videos/123456789012345/";
  const pageVideo = parseGalleryVideoUrl(pageVideoUrl);
  assert.equal(pageVideo.ok, true);
  assert.equal(pageVideo.provider, "facebook");
  assert.equal(pageVideo.sourceUrl, pageVideoUrl);
  assert.equal(pageVideo.videoId, "123456789012345");
  assert.match(galleryVideoEmbedSrc(pageVideo), /plugins\/video\.php\?href=/);
  assert.equal(galleryVideoEmbedSrc(pageVideo).includes(encodeURIComponent("https://www.facebook.com/PhanQuanGuitars/videos/123456789012345/")), true);

  const fbWatchUrl = "https://fb.watch/abcDE12/";
  const fbWatch = parseGalleryVideoUrl(fbWatchUrl);
  assert.equal(fbWatch.ok, true);
  assert.equal(fbWatch.provider, "facebook");
  assert.equal(fbWatch.sourceUrl, fbWatchUrl);
  assert.equal(fbWatch.videoId, "abcDE12");
  assert.equal(
    galleryVideoEmbedSrc(fbWatch).includes(`href=${encodeURIComponent("https://fb.watch/abcDE12/")}`),
    true,
  );

  const shareUrl = "https://www.facebook.com/share/v/1AbCdEfGhIj/";
  const share = parseGalleryVideoUrl(shareUrl);
  assert.equal(share.ok, true);
  assert.equal(share.sourceUrl, shareUrl);

  const vimeo = parseGalleryVideoUrl("https://vimeo.com/123456789");
  assert.equal(vimeo.ok, true);
  assert.equal(vimeo.provider, "vimeo");
  assert.equal(galleryVideoEmbedSrc(vimeo), "https://player.vimeo.com/video/123456789");

  const direct = parseGalleryVideoUrl("https://cdn.example.com/clip.webm?token=1");
  assert.equal(direct.ok, true);
  assert.equal(direct.provider, "direct");
  assert.equal(galleryVideoEmbedSrc(direct), "");
  assert.equal(galleryDirectVideoPath({ kind: "video", ...direct }), "https://cdn.example.com/clip.webm?token=1");
  assert.equal(
    galleryDirectVideoPath({
      kind: "video",
      provider: "upload",
      path: "/uploads/gallery/videos/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4",
    }),
    "/uploads/gallery/videos/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4",
  );
  assert.equal(
    galleryUploadMime("/uploads/gallery/videos/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4"),
    "video/mp4",
  );
  assert.equal(galleryUploadMime("https://cdn.example.com/clip.webm?token=1"), "video/webm");
  assert.equal(
    galleryVideoPreviewSrc("/uploads/gallery/videos/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4"),
    "/uploads/gallery/videos/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4#t=0.001",
  );

  assert.equal(parseGalleryVideoUrl("javascript:alert(1)").ok, false);
  assert.equal(parseGalleryVideoUrl("https://example.com/page").code, "UNSUPPORTED_VIDEO_URL");
  assert.equal(parseGalleryVideoUrl("not-a-url").ok, false);
  assert.equal(parseGalleryVideoUrl("").code, "VIDEO_URL_REQUIRED");
  assert.equal(parseGalleryVideoUrl('<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>').ok, false);
  assert.equal(parseGalleryVideoUrl(facebookUrl, { expectedProvider: "youtube" }).code, "PROVIDER_MISMATCH");
  assert.equal(
    galleryVideoEmbedSrc({ kind: "video", url: youtubeUrl }),
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  );
});

test("gallery editor keeps original video URLs through add, hydrate, and title updates", () => {
  const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  const shortsUrl = "https://www.youtube.com/shorts/dQw4w9WgXcQ";
  const facebookUrl = "https://www.facebook.com/username/videos/123456789012345";
  const reelUrl = "https://www.facebook.com/reel/987654321098765";
  const fbWatchUrl = "https://fb.watch/abcDE12/";

  for (const url of [youtubeUrl, shortsUrl, facebookUrl, reelUrl, fbWatchUrl]) {
    const saved = {
      id: "post1",
      title: "Session",
      excerpt: "Live",
      content: "Body",
      category: "video",
      status: "published",
      publishedAt: "2026-01-02T00:00:00.000Z",
      order: 1,
      showAtHome: false,
      coverMediaId: "m1",
      media: [{ id: "m1", kind: "video", url, sourceUrl: url, path: url, provider: parseGalleryVideoUrl(url).provider }],
    };
    const form = formFromPost(saved);
    assert.equal(form.media[0].sourceUrl, url);
    const payload = payloadFromForm({ ...form, titleVi: "Session updated", excerptVi: "Edited" });
    assert.equal(payload.title, "Session updated");
    assert.equal(payload.translations.vi.title, "Session updated");
    assert.equal(payload.translations.en.title, "");
    assert.equal(form.pin, false);
    assert.equal(payload.pin, false);
    assert.equal(payload.media[0].sourceUrl, url);
    assert.equal(payload.media[0].url, url);
    assert.equal(payload.media[0].kind, "video");
  }

  const pinned = formFromPost({
    id: "pin-1",
    title: "Pinned story",
    category: "process",
    status: "published",
    pin: true,
    media: [{ id: "i1", kind: "image", path: "/uploads/gallery/images/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png", provider: "upload" }],
  });
  assert.equal(pinned.pin, true);
  assert.equal(payloadFromForm(pinned).pin, true);

  const imageOnly = formFromPost({
    id: "img",
    title: "Bench",
    category: "process",
    status: "draft",
    media: [{ id: "i1", kind: "image", path: "/uploads/gallery/images/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png", provider: "upload" }],
  });
  assert.equal(imageOnly.media[0].kind, "image");
  assert.equal(payloadFromForm(imageOnly).media[0].provider, "upload");

  const legacy = hydrateGalleryMedia({
    id: "legacy",
    kind: "video",
    path: youtubeUrl,
    provider: "upload",
  });
  assert.equal(legacy.sourceUrl, youtubeUrl);
  assert.equal(legacy.provider, "youtube");
  assert.equal(legacy.videoId, "dQw4w9WgXcQ");
});

test("Facebook gallery videos use a custom poster and keep it through edit payloads", () => {
  const facebookUrl = "https://www.facebook.com/watch/?v=123456789012345";
  const poster = "/uploads/gallery/images/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg";
  const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

  assert.equal(galleryPosterUrl({ kind: "video", sourceUrl: facebookUrl, provider: "facebook" }), "");
  assert.equal(
    galleryPosterUrl({ kind: "video", sourceUrl: facebookUrl, provider: "facebook", thumbnail: poster }),
    poster,
  );
  assert.equal(
    galleryPosterUrl({ kind: "video", url: youtubeUrl, provider: "youtube" }),
    "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  );

  const form = formFromPost({
    id: "fb1",
    title: "Facebook session",
    category: "video",
    status: "published",
    media: [{ id: "m1", kind: "video", sourceUrl: facebookUrl, url: facebookUrl, provider: "facebook", thumbnail: poster }],
  });
  assert.equal(form.media[0].thumbnail, poster);
  const payload = payloadFromForm({ ...form, titleVi: "Facebook session updated" });
  assert.equal(payload.title, "Facebook session updated");
  assert.equal(payload.media[0].sourceUrl, facebookUrl);
  assert.equal(payload.media[0].thumbnail, poster);
  assert.equal(tFor("en", "gallery.form.uploadPoster"), "Upload poster image");
  assert.equal(tFor("en", "gallery.video.facebookPreview"), "Facebook video");
  assert.equal(tFor("en", "gallery.video.unmute"), "Unmute video");
  assert.equal(tFor("vi", "gallery.video.unmute"), "Bật tiếng");
  assert.equal(tFor("en", "gallery.video.close"), "Close video");
  const facebookAutoplay = galleryVideoEmbedSrc(parseGalleryVideoUrl(facebookUrl), { autoplay: true });
  assert.match(facebookAutoplay, /autoplay=1/);
  assert.match(facebookAutoplay, /[?&]mute=0/);
  assert.equal(facebookAutoplay.includes("mute=1"), false);
  assert.equal(
    galleryVideoEmbedSrc(parseGalleryVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), { autoplay: true }),
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1",
  );
  let unmuteCount = 0;
  let playCount = 0;
  const player = {
    unmute() {
      unmuteCount += 1;
    },
    play() {
      playCount += 1;
    },
  };
  requestFacebookAudiblePlayback(player);
  requestFacebookAudiblePlayback(player);
  assert.equal(unmuteCount, 1);
  assert.equal(playCount, 1);
  requestFacebookAudiblePlayback(player, { force: true });
  assert.equal(unmuteCount, 2);
  assert.equal(
    facebookVideoHref("https://www.facebook.com/reel/1649522569474963"),
    "https://www.facebook.com/reel/1649522569474963",
  );
});
