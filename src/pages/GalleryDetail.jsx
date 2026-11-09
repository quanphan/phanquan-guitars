import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BackLink from "../components/BackLink.jsx";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import GalleryMediaPlayer from "../components/gallery/GalleryMediaPlayer.jsx";
import { galleryPostCopy, orderedGalleryMedia } from "../data/gallery.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { getPublicGalleryPost } from "../services/galleryService.js";

export default function GalleryDetail() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState("loading");
  const [reloadToken, setReloadToken] = useState(0);
  const retry = useCallback(() => setReloadToken((current) => current + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      setPost(null);
      const result = await getPublicGalleryPost(id);
      if (cancelled) return;
      if (!result.ok) {
        setStatus(result.code === "NOT_FOUND" ? "notFound" : "error");
        return;
      }
      setPost(result.post);
      setStatus("ready");
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  if (status === "loading") {
    return (
      <section className="mx-auto max-w-5xl px-6 py-24 lg:px-10">
        <p className="text-sm text-muted">{t("gallery.loading")}</p>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="mx-auto max-w-5xl px-6 py-24 lg:px-10">
        <p className="text-sm text-muted">{t("gallery.unavailable")}</p>
        <Button type="button" variant="outline" className="mt-6" onClick={retry}>
          {t("home.artOfMaking.retry")}
        </Button>
      </section>
    );
  }

  if (status === "notFound" || !post) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-24 lg:px-10">
        <p className="text-sm text-muted">{t("gallery.errors.NOT_FOUND")}</p>
        <Link to="/gallery" className="mt-6 inline-block text-[11px] uppercase tracking-[0.22em] text-gold">
          {t("gallery.title")}
        </Link>
      </section>
    );
  }

  const media = orderedGalleryMedia(post);
  const copy = galleryPostCopy(post, language);

  return (
    <section className="pb-24">
      <PageHeader eyebrow={t("gallery.eyebrow")} title={copy.title} description={copy.excerpt || undefined}>
        <div className="mt-8">
          <BackLink to="/gallery" label={t("gallery.title")} />
        </div>
      </PageHeader>
      <div className="mx-auto mt-10 max-w-5xl px-6 lg:px-10">
        {media[0] ? <GalleryMediaPlayer item={media[0]} title={copy.title} /> : null}
        {copy.content ? (
          <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">{copy.content}</p>
        ) : null}
        {media.length > 1 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {media.slice(1).map((item) => (
              <GalleryMediaPlayer key={item.id} item={item} title={copy.title} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
