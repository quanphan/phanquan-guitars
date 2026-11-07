import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Link } from "react-router-dom";
import { mediaUrl } from "../../config/api.js";
import { galleryPostPath, homeGalleryPosts, storyExcerpt, storyVideo } from "../../data/gallery.js";
import { galleryPosterUrl, isExternalGalleryVideo } from "../../data/galleryVideo.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { loadFacebookSdk } from "../../services/facebookSdk.js";
import { warmupFacebookMedia } from "../../services/facebookPlayerPool.js";
import { listPublicGallery } from "../../services/galleryService.js";
import Button from "../Button.jsx";
import VideoModal from "../gallery/VideoModal.jsx";

function coverOf(post) {
  return post?.cover || post?.media?.[0] || null;
}

function CoverMedia({ cover, title, featured = false, wide = false, priority = false, video = null, onPlay }) {
  const { t } = useLanguage();
  const poster = cover ? galleryPosterUrl(cover, mediaUrl) : "";
  const videoPoster = video ? galleryPosterUrl(video, mediaUrl) : "";
  const fileSrc = cover ? mediaUrl(cover.url || cover.path) : "";
  const usePoster = Boolean(poster && (cover?.kind === "image" || isExternalGalleryVideo(cover)));
  const frame = featured && !wide ? "aspect-[4/5] sm:aspect-[16/10] lg:aspect-[4/5]" : "aspect-[16/10]";
  const thumb = videoPoster || poster || fileSrc;

  return (
    <div className={`relative w-full overflow-hidden bg-ink ${frame}`}>
      {cover?.kind === "video" && fileSrc && !usePoster && !videoPoster ? (
        <video
          src={fileSrc}
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full bg-ink object-cover object-center"
        />
      ) : thumb ? (
        <img
          src={thumb}
          alt={title}
          width={featured ? 1400 : 960}
          height={featured ? 1750 : 600}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full bg-ink object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 bg-panel" aria-hidden="true" />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-charcoal/70 to-transparent" />
      {video && onPlay ? (
        <>
          <div className="pointer-events-none absolute inset-0 bg-charcoal/40 transition-colors duration-300 group-hover:bg-charcoal/50" />
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onPlay();
            }}
            className="absolute inset-0 z-20 flex items-center justify-center [transform:translate3d(0,0,1px)]"
            aria-label={t("home.artOfMaking.playVideo")}
          >
            <span className="flex size-16 items-center justify-center rounded-full border border-gold bg-charcoal/80 text-gold shadow-[0_0_0_1px_rgba(201,168,76,0.35)] transition-transform duration-300 group-hover:scale-110 sm:size-[4.5rem]">
              <svg viewBox="0 0 24 24" className="ml-1 size-7 fill-current sm:size-8" aria-hidden="true">
                <path d="M8 5.14v13.72L19 12 8 5.14z" />
              </svg>
            </span>
          </button>
        </>
      ) : null}
    </div>
  );
}

function StoryCopy({ post, featured = false }) {
  const { t } = useLanguage();
  const excerpt = storyExcerpt(post.excerpt);

  return (
    <div className={featured ? "pt-6 lg:pt-8" : "pt-5"}>
      <h3 className={`font-display tracking-wide text-ivory ${featured ? "text-3xl sm:text-4xl" : "text-2xl"}`}>
        {post.title}
      </h3>
      {excerpt ? (
        <p className={`mt-3 text-sm leading-relaxed text-muted ${featured ? "sm:text-base" : ""}`}>{excerpt}</p>
      ) : null}
      <span className="mt-4 inline-block text-[11px] uppercase tracking-[0.22em] text-gold">
        {t("home.artOfMaking.view")}
      </span>
    </div>
  );
}

function StoryCard({ post, featured = false, wide = false, priority = false, onPlayVideo }) {
  const href = galleryPostPath(post.id);
  const cover = coverOf(post);
  const video = storyVideo(post);

  if (!video) {
    return (
      <article className="group">
        <Link to={href} className="block">
          <CoverMedia cover={cover} title={post.title} featured={featured} wide={wide} priority={priority} />
          <StoryCopy post={post} featured={featured} />
        </Link>
      </article>
    );
  }

  return (
    <article className="group">
      <CoverMedia
        cover={cover}
        title={post.title}
        featured={featured}
        wide={wide}
        priority={priority}
        video={video}
        onPlay={() => flushSync(() => onPlayVideo({ post, video }))}
      />
      <Link to={href} className="block">
        <StoryCopy post={post} featured={featured} />
      </Link>
    </article>
  );
}

export default function ArtOfMaking() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [reloadToken, setReloadToken] = useState(0);
  const [playing, setPlaying] = useState(null);
  const retry = useCallback(() => setReloadToken((current) => current + 1), []);
  const closeVideo = useCallback(() => setPlaying(null), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      const listed = await listPublicGallery({ showAtHome: true, limit: 50 });
      if (cancelled) return;
      if (!listed.ok) {
        setPosts([]);
        setStatus("error");
        return;
      }
      const homePosts = homeGalleryPosts(listed.items);
      setPosts(homePosts);
      setStatus("ready");
      void loadFacebookSdk();
      homePosts.forEach((post) => warmupFacebookMedia(post.media));
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  if (status === "ready" && posts.length === 0) {
    return null;
  }

  const featured = posts[0];
  const supporting = posts.slice(1, 3);
  const rest = posts.slice(3);

  return (
    <section className="border-y border-gold/20 bg-charcoal py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-gold">
            {t("home.artOfMaking.eyebrow")}
          </p>
          <h2 className="mt-4 font-display text-4xl font-medium uppercase tracking-wide text-ivory sm:text-5xl lg:text-6xl">
            {t("home.artOfMaking.title")}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            {t("home.artOfMaking.description")}
          </p>
        </div>
        {status === "loading" ? (
          <p className="mt-16 text-center text-sm text-muted">{t("home.artOfMaking.loading")}</p>
        ) : null}
        {status === "error" ? (
          <div className="mt-16 space-y-4 text-center">
            <p className="text-sm text-muted">{t("home.artOfMaking.error")}</p>
            <Button type="button" variant="outline" onClick={retry}>
              {t("home.artOfMaking.retry")}
            </Button>
          </div>
        ) : null}
        {status === "ready" && featured ? (
          <div className="mt-16">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8 lg:items-start">
              <div className={supporting.length ? "lg:col-span-7" : "lg:col-span-12"}>
                <StoryCard post={featured} featured wide={supporting.length < 2} priority onPlayVideo={setPlaying} />
              </div>
              {supporting.length ? (
                <div className="flex flex-col gap-10 lg:col-span-5">
                  {supporting.map((post, index) => (
                    <StoryCard key={post.id} post={post} priority={index === 0} onPlayVideo={setPlaying} />
                  ))}
                </div>
              ) : null}
            </div>
            {rest.length ? (
              <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
                {rest.map((post) => (
                  <StoryCard key={post.id} post={post} onPlayVideo={setPlaying} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {playing ? <VideoModal item={playing.video} title={playing.post.title} onClose={closeVideo} /> : null}
    </section>
  );
}
