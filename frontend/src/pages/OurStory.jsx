import { useContent } from "@/context/ContentContext";

const FALLBACK = {
  hero_image: "/venue/slide-5.jpg",
  intro: "Plantagenet Players have entertained Mount Barker and the Great Southern with variety shows, satire, melodrama, music and community productions since 1953.",
  timeline: [],
  gallery: ["/venue/slide-8.jpg", "/venue/slide-3.jpg", "/venue/slide-4.jpg", "/venue/slider-2.jpg"],
};

export default function OurStory() {
  const { content } = useContent();
  const c = { ...FALLBACK, ...(content.story || {}) };

  return (
    <div>
      <div className="relative h-[40vh] min-h-[300px] overflow-hidden grain">
        <img src={c.hero_image} alt="The historic Plantagenet Hall" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#550000] via-[#550000]/70 to-[#550000]/30" />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <p className="eyebrow mb-2">Our story</p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-amber-50 tracking-tight max-w-3xl">More than 70 years in the spotlight.</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-lg text-amber-50/75 leading-relaxed">{c.intro}</p>

        {c.timeline?.length > 0 && (
          <div className="mt-16 relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#D4AF37]/25" />
            <div className="space-y-10">
              {c.timeline.map((t, i) => (
                <div key={i} className="relative pl-10" data-testid={`timeline-${i}`}>
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-[#8B1E26] border-2 border-[#D4AF37]" />
                  <p className="font-mono text-xs tracking-[0.25em] uppercase text-[#D4AF37]">{t.year}</p>
                  <p className="mt-2 text-amber-50/75 leading-relaxed">{t.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {c.gallery?.length > 0 && (
          <div className="mt-20">
            <p className="eyebrow mb-4">Through the years</p>
            <h2 className="font-serif text-3xl text-amber-50 mb-8">Moments from our productions.</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="story-gallery">
              {c.gallery.map((src, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-[#D4AF37]/15 aspect-[4/3]">
                  <img src={src} alt="Plantagenet Players production" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-16 p-6 rounded-2xl bg-[#6B0F0F] border border-[#D4AF37]/15" data-testid="documents-section">
          <p className="eyebrow mb-3">Governance</p>
          <h2 className="font-serif text-2xl text-amber-50 mb-4">Members' documents</h2>
          <div className="flex flex-wrap gap-4">
            {content.documents?.constitution_url ? (
              <a href={content.documents.constitution_url} target="_blank" rel="noreferrer" data-testid="doc-constitution" className="px-5 py-3 rounded-full bg-[#7A1616] border border-[#D4AF37]/30 text-amber-50 text-sm hover:border-[#D4AF37] transition-colors">View our Constitution</a>
            ) : (
              <span data-testid="doc-constitution-pending" className="px-5 py-3 rounded-full bg-[#7A1616]/40 border border-dashed border-[#D4AF37]/25 text-amber-50/50 text-sm cursor-default">Constitution — coming soon</span>
            )}
            {content.documents?.agm_url ? (
              <a href={content.documents.agm_url} target="_blank" rel="noreferrer" data-testid="doc-agm" className="px-5 py-3 rounded-full bg-[#7A1616] border border-[#D4AF37]/30 text-amber-50 text-sm hover:border-[#D4AF37] transition-colors">Latest AGM minutes</a>
            ) : (
              <span data-testid="doc-agm-pending" className="px-5 py-3 rounded-full bg-[#7A1616]/40 border border-dashed border-[#D4AF37]/25 text-amber-50/50 text-sm cursor-default">Latest AGM minutes — coming soon</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
