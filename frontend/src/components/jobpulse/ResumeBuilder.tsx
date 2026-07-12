"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { FileText, Download, Plus, Trash2, Loader2, CheckCircle2, Briefcase, GraduationCap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResumePreview, { type ResumeData } from "./ResumeTemplates";

const EMPTY_RESUME: ResumeData = {
  template: "modern",
  contact: { name: "", email: "", phone: "", location: "", headline: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
};

const TEMPLATES: Array<{
  id: ResumeData["template"];
  name: string;
  description: string;
  accent: string;
}> = [
  { id: "modern", name: "Modern", description: "Sidebar layout with accent color", accent: "#F2A93B" },
  { id: "classic", name: "Classic", description: "Traditional centered header", accent: "#1B212B" },
  { id: "minimalist", name: "Minimalist", description: "Clean, lots of whitespace", accent: "#3FA796" },
];

export default function ResumeBuilder() {
  const [data, setData] = useState<ResumeData>(EMPTY_RESUME);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const saveTimer = useRef<Timer | null>(null);

  useEffect(() => {
    fetch("/api/resume")
      .then((r) => r.json())
      .then((d) => setData({ ...EMPTY_RESUME, ...d }))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const save = useCallback(async (d: ResumeData) => {
    setIsSaving(true);
    try {
      await fetch("/api/resume", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  }, []);

  const scheduleSave = useCallback(
    (d: ResumeData) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(d), 1500);
    },
    [save],
  );

  function update<K extends keyof ResumeData>(key: K, value: ResumeData[K]) {
    const next = { ...data, [key]: value };
    setData(next);
    scheduleSave(next);
  }

  function updateContact(key: keyof ResumeData["contact"], value: string) {
    const next = { ...data, contact: { ...data.contact, [key]: value } };
    setData(next);
    scheduleSave(next);
  }

  function addExperience() {
    update("experience", [
      ...data.experience,
      { id: Math.random().toString(36).slice(2), company: "", role: "", startDate: "", endDate: "", current: false, description: "" },
    ]);
  }
  function updateExperience(id: string, field: string, value: any) {
    update("experience", data.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }
  function removeExperience(id: string) {
    update("experience", data.experience.filter((e) => e.id !== id));
  }

  function addEducation() {
    update("education", [
      ...data.education,
      { id: Math.random().toString(36).slice(2), institution: "", degree: "", field: "", startDate: "", endDate: "" },
    ]);
  }
  function updateEducation(id: string, field: string, value: any) {
    update("education", data.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }
  function removeEducation(id: string) {
    update("education", data.education.filter((e) => e.id !== id));
  }

  function addSkill() {
    const s = skillInput.trim();
    if (!s) return;
    if (!data.skills.includes(s)) update("skills", [...data.skills, s]);
    setSkillInput("");
  }
  function removeSkill(s: string) {
    update("skills", data.skills.filter((x) => x !== s));
  }

  function downloadPDF() {
    window.print();
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-hairline bg-surface p-12 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-rising mx-auto" />
        <p className="font-mono text-xs text-muted-foreground mt-2">Loading resume builder…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-hairline bg-surface p-4 flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-rising" />
          <h2 className="font-mono text-xs uppercase tracking-[0.2em]">Resume Builder</h2>
        </div>
        <div className="flex items-center gap-3">
          {isSaving ? (
            <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1 font-mono text-[10px] text-rising">
              <CheckCircle2 className="h-3 w-3" /> Saved {lastSaved.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          ) : null}
          <Button onClick={downloadPDF} size="sm" className="gap-1.5 bg-rising text-bg hover:bg-rising/90 font-mono">
            <Download className="h-3.5 w-3.5" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4 print:block">
        <div className="space-y-4 print:hidden">
          <div className="rounded-lg border border-hairline bg-surface p-4">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-rising mb-2">Template</h3>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => update("template", t.id)}
                  className={`rounded border p-2 text-left transition-colors ${
                    data.template === t.id ? "border-rising bg-rising/10" : "border-hairline hover:border-rising/40"
                  }`}
                >
                  <div className="h-1 w-full rounded mb-1.5" style={{ backgroundColor: t.accent }} />
                  <div className="font-mono text-[10px] uppercase tracking-wider text-foreground">{t.name}</div>
                  <div className="font-mono text-[9px] text-muted-foreground mt-0.5 leading-tight">{t.description}</div>
                </button>
              ))}
            </div>
          </div>

          <EditorSection title="Contact">
            <Input label="Full name" value={data.contact.name} onChange={(v) => updateContact("name", v)} placeholder="Ada Lovelace" />
            <Input label="Headline" value={data.contact.headline} onChange={(v) => updateContact("headline", v)} placeholder="Senior Frontend Engineer" />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Email" value={data.contact.email} onChange={(v) => updateContact("email", v)} placeholder="ada@x.com" />
              <Input label="Phone" value={data.contact.phone} onChange={(v) => updateContact("phone", v)} placeholder="+1 555 0100" />
            </div>
            <Input label="Location" value={data.contact.location} onChange={(v) => updateContact("location", v)} placeholder="London, UK" />
            <div className="grid grid-cols-3 gap-2">
              <Input label="Website" value={data.contact.website ?? ""} onChange={(v) => updateContact("website", v)} placeholder="ada.dev" />
              <Input label="LinkedIn" value={data.contact.linkedin ?? ""} onChange={(v) => updateContact("linkedin", v)} placeholder="/in/ada" />
              <Input label="GitHub" value={data.contact.github ?? ""} onChange={(v) => updateContact("github", v)} placeholder="@ada" />
            </div>
          </EditorSection>

          <EditorSection title="Professional Summary">
            <textarea
              value={data.summary}
              onChange={(e) => update("summary", e.target.value)}
              rows={4}
              placeholder="A short paragraph highlighting your background, key skills, and what you're looking for…"
              className="w-full rounded border border-hairline bg-bg px-3 py-2 font-sans text-sm text-foreground focus:border-rising focus:outline-none resize-none"
            />
          </EditorSection>

          <EditorSection title="Experience" action={<AddButton onClick={addExperience} />}>
            {data.experience.length === 0 ? (
              <EmptyHint icon={<Briefcase className="h-4 w-4" />} text="Click + to add your first role" />
            ) : (
              <div className="space-y-2">
                {data.experience.map((e) => (
                  <div key={e.id} className="rounded border border-hairline bg-bg/40 p-2.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid grid-cols-2 gap-2 flex-1">
                        <Input label="Role" value={e.role} onChange={(v) => updateExperience(e.id, "role", v)} placeholder="Senior Engineer" small />
                        <Input label="Company" value={e.company} onChange={(v) => updateExperience(e.id, "company", v)} placeholder="Acme Inc." small />
                      </div>
                      <button onClick={() => removeExperience(e.id)} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Start" value={e.startDate} onChange={(v) => updateExperience(e.id, "startDate", v)} placeholder="Jan 2022" small />
                      <Input label="End" value={e.current ? "Present" : e.endDate} onChange={(v) => updateExperience(e.id, "endDate", v)} placeholder="Dec 2024" small disabled={e.current} />
                    </div>
                    <label className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                      <input type="checkbox" checked={e.current} onChange={(e2) => updateExperience(e.id, "current", e2.target.checked)} className="accent-rising" />
                      Currently working here
                    </label>
                    <textarea
                      value={e.description}
                      onChange={(ev) => updateExperience(e.id, "description", ev.target.value)}
                      rows={3}
                      placeholder="What did you build? Use bullets like: 'Led migration to TypeScript across 12 services'"
                      className="w-full rounded border border-hairline bg-bg px-2 py-1.5 font-sans text-xs text-foreground focus:border-rising focus:outline-none resize-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </EditorSection>

          <EditorSection title="Education" action={<AddButton onClick={addEducation} />}>
            {data.education.length === 0 ? (
              <EmptyHint icon={<GraduationCap className="h-4 w-4" />} text="Click + to add education" />
            ) : (
              <div className="space-y-2">
                {data.education.map((e) => (
                  <div key={e.id} className="rounded border border-hairline bg-bg/40 p-2.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid grid-cols-2 gap-2 flex-1">
                        <Input label="Institution" value={e.institution} onChange={(v) => updateEducation(e.id, "institution", v)} placeholder="MIT" small />
                        <Input label="Degree" value={e.degree} onChange={(v) => updateEducation(e.id, "degree", v)} placeholder="B.Sc." small />
                      </div>
                      <button onClick={() => removeEducation(e.id)} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input label="Field" value={e.field} onChange={(v) => updateEducation(e.id, "field", v)} placeholder="Computer Science" small />
                      <Input label="Start" value={e.startDate} onChange={(v) => updateEducation(e.id, "startDate", v)} placeholder="2016" small />
                      <Input label="End" value={e.endDate} onChange={(v) => updateEducation(e.id, "endDate", v)} placeholder="2020" small />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </EditorSection>

          <EditorSection title="Skills">
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Type a skill and press Enter"
                className="flex-1 rounded border border-hairline bg-bg px-3 py-1.5 font-sans text-sm text-foreground focus:border-rising focus:outline-none"
              />
              <Button variant="outline" size="sm" onClick={addSkill} className="border-hairline">
                Add
              </Button>
            </div>
            {data.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {data.skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-hairline bg-bg font-mono text-xs text-foreground">
                    {s}
                    <button onClick={() => removeSkill(s)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </EditorSection>
        </div>

        <div className="rounded-lg border border-hairline bg-white print:border-0 print:rounded-0">
          <ResumePreview data={data} />
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          body { background: white !important; }
          @page { margin: 0.5in; }
        }
      `}</style>
    </div>
  );
}

function EditorSection({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-rising">{title}</h3>
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded border border-hairline px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:border-rising hover:text-rising transition-colors"
    >
      <Plus className="h-3 w-3" /> Add
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  small = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  small?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded border border-hairline bg-bg ${small ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"} font-sans text-foreground focus:border-rising focus:outline-none disabled:opacity-50`}
      />
    </div>
  );
}

function EmptyHint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded border border-dashed border-hairline text-muted-foreground">
      {icon}
      <span className="font-mono text-[10px]">{text}</span>
    </div>
  );
}
