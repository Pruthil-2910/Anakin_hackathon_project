"use client";

/**
 * Three resume templates: Modern, Classic, Minimalist.
 * Each takes the same ResumeData and renders a print-friendly layout.
 */

export interface ResumeData {
  template: "modern" | "classic" | "minimalist";
  contact: {
    name: string;
    email: string;
    phone: string;
    location: string;
    headline: string;
    website?: string;
    linkedin?: string;
    github?: string;
  };
  summary: string;
  experience: Array<{
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
  }>;
  skills: string[];
}

export default function ResumePreview({ data }: { data: ResumeData }) {
  if (data.template === "modern") return <ModernTemplate data={data} />;
  if (data.template === "classic") return <ClassicTemplate data={data} />;
  return <MinimalistTemplate data={data} />;
}

function ModernTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="bg-white text-black min-h-[800px] flex">
      <aside className="w-1/3 bg-[#1B212B] text-white p-6">
        <h1 className="text-2xl font-bold leading-tight">{data.contact.name || "Your Name"}</h1>
        <p className="text-sm mt-1 text-[#F2A93B]">{data.contact.headline || "Your headline"}</p>

        <div className="mt-6 space-y-1 text-xs">
          {data.contact.email && <div>{data.contact.email}</div>}
          {data.contact.phone && <div>{data.contact.phone}</div>}
          {data.contact.location && <div>{data.contact.location}</div>}
          {data.contact.website && <div>{data.contact.website}</div>}
          {data.contact.linkedin && <div>LinkedIn: {data.contact.linkedin}</div>}
          {data.contact.github && <div>GitHub: {data.contact.github}</div>}
        </div>

        {data.skills.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xs uppercase tracking-widest text-[#F2A93B] border-b border-white/20 pb-1 mb-2">
              Skills
            </h2>
            <ul className="space-y-1 text-xs">
              {data.skills.map((s) => (
                <li key={s} className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-[#F2A93B]" /> {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.education.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xs uppercase tracking-widest text-[#F2A93B] border-b border-white/20 pb-1 mb-2">
              Education
            </h2>
            {data.education.map((e) => (
              <div key={e.id} className="mb-2 text-xs">
                <div className="font-semibold">{e.institution || "Institution"}</div>
                <div className="text-white/80">
                  {e.degree} {e.field && `in ${e.field}`}
                </div>
                <div className="text-white/60 text-[10px]">
                  {e.startDate} – {e.endDate}
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

      <main className="flex-1 p-6">
        {data.summary && (
          <section className="mb-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#F2A93B] border-b-2 border-[#F2A93B] pb-1 mb-2">
              Profile
            </h2>
            <p className="text-sm leading-relaxed">{data.summary}</p>
          </section>
        )}

        {data.experience.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#F2A93B] border-b-2 border-[#F2A93B] pb-1 mb-3">
              Experience
            </h2>
            <div className="space-y-4">
              {data.experience.map((e) => (
                <div key={e.id}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-semibold text-sm">{e.role || "Role"}</h3>
                    <span className="text-xs text-gray-500">
                      {e.startDate} – {e.current ? "Present" : e.endDate}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mb-1">{e.company}</div>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{e.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function ClassicTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="bg-white text-black min-h-[800px] p-10">
      <header className="text-center border-b-2 border-black pb-3 mb-5">
        <h1 className="text-3xl font-serif font-bold tracking-wide">{data.contact.name || "Your Name"}</h1>
        <p className="text-sm mt-1 italic">{data.contact.headline || "Your headline"}</p>
        <div className="text-xs mt-2 text-gray-700 flex items-center justify-center gap-2 flex-wrap">
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>· {data.contact.phone}</span>}
          {data.contact.location && <span>· {data.contact.location}</span>}
          {data.contact.website && <span>· {data.contact.website}</span>}
          {data.contact.linkedin && <span>· LinkedIn: {data.contact.linkedin}</span>}
        </div>
      </header>

      {data.summary && (
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-1 border-b border-gray-300 pb-0.5">
            Summary
          </h2>
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </section>
      )}

      {data.experience.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-2 border-b border-gray-300 pb-0.5">
            Professional Experience
          </h2>
          <div className="space-y-3">
            {data.experience.map((e) => (
              <div key={e.id}>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-bold text-sm">
                    {e.role || "Role"} — <span className="font-normal italic">{e.company}</span>
                  </h3>
                  <span className="text-xs text-gray-600">
                    {e.startDate} – {e.current ? "Present" : e.endDate}
                  </span>
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-wrap mt-0.5">{e.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.education.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-2 border-b border-gray-300 pb-0.5">
            Education
          </h2>
          <div className="space-y-1.5">
            {data.education.map((e) => (
              <div key={e.id} className="flex items-baseline justify-between">
                <div>
                  <span className="font-semibold text-sm">{e.institution}</span>
                  <span className="text-sm italic"> — {e.degree} {e.field && `in ${e.field}`}</span>
                </div>
                <span className="text-xs text-gray-600">
                  {e.startDate} – {e.endDate}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.skills.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-2 border-b border-gray-300 pb-0.5">
            Skills
          </h2>
          <p className="text-sm leading-relaxed">{data.skills.join(" · ")}</p>
        </section>
      )}
    </div>
  );
}

function MinimalistTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="bg-white text-black min-h-[800px] p-12">
      <header className="mb-8">
        <h1 className="text-4xl font-light tracking-tight">{data.contact.name || "Your Name"}</h1>
        <p className="text-base text-[#3FA796] mt-1">{data.contact.headline || "Your headline"}</p>
        <div className="text-xs mt-3 text-gray-500 flex items-center gap-3 flex-wrap">
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{data.contact.phone}</span>}
          {data.contact.location && <span>{data.contact.location}</span>}
          {data.contact.website && <span>{data.contact.website}</span>}
        </div>
      </header>

      {data.summary && (
        <section className="mb-8">
          <p className="text-sm leading-relaxed text-gray-700">{data.summary}</p>
        </section>
      )}

      {data.experience.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-[0.3em] text-[#3FA796] mb-4">Experience</h2>
          <div className="space-y-5">
            {data.experience.map((e) => (
              <div key={e.id} className="grid grid-cols-4 gap-4">
                <div className="text-xs text-gray-500 col-span-1">
                  {e.startDate} – {e.current ? "Present" : e.endDate}
                </div>
                <div className="col-span-3">
                  <h3 className="text-sm font-medium">{e.role || "Role"}</h3>
                  <div className="text-xs text-gray-600 mb-1">{e.company}</div>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap text-gray-700">{e.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.education.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-[0.3em] text-[#3FA796] mb-4">Education</h2>
          <div className="space-y-2">
            {data.education.map((e) => (
              <div key={e.id} className="grid grid-cols-4 gap-4">
                <div className="text-xs text-gray-500 col-span-1">
                  {e.startDate} – {e.endDate}
                </div>
                <div className="col-span-3">
                  <div className="text-sm font-medium">{e.institution}</div>
                  <div className="text-xs text-gray-600">{e.degree} {e.field && `in ${e.field}`}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.skills.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-[0.3em] text-[#3FA796] mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((s) => (
              <span key={s} className="text-xs px-2 py-1 border border-gray-300 rounded">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
