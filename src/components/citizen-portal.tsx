"use client";

import { useMemo, useState } from "react";
import { Building2, FileCheck2, MapPin, Search, Send } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/legislation";
import { DOCUMENTS, authorNames } from "@/lib/mock-data";

const PUBLIC_STAGES = ["approved", "enacted"];

const PROJECTS: {
  name: string;
  municipality: string;
  status: "Ongoing" | "Planned" | "Completed";
  budget: string;
}[] = [
  { name: "Santa Cruz Coastal Road Improvement", municipality: "Bgy. Sabang", status: "Ongoing", budget: "₱120M" },
  { name: "Tabalong Flood Control Project", municipality: "Bgy. Tabalong", status: "Planned", budget: "₱85M" },
  { name: "Santa Cruz District Hospital Modernization", municipality: "Poblacion North", status: "Ongoing", budget: "₱210M" },
  { name: "Santa Cruz River Watershed Reforestation", municipality: "Bgy. Bayto", status: "Completed", budget: "₱40M" },
];

const PROJECT_STATUS: Record<
  (typeof PROJECTS)[number]["status"],
  "default" | "secondary" | "outline"
> = {
  Completed: "default",
  Ongoing: "secondary",
  Planned: "outline",
};

export function CitizenPortal() {
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const approved = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DOCUMENTS.filter((d) => PUBLIC_STAGES.includes(d.stage)).filter(
      (d) =>
        !q ||
        [d.referenceNo, d.title, d.summary, d.category]
          .join(" ")
          .toLowerCase()
          .includes(q),
    );
  }, [query]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you — your feedback was received.", {
      description: "This is a demo; submissions are not yet stored.",
    });
    setName("");
    setEmail("");
    setMessage("");
  };

  const inputClass =
    "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <div className="space-y-10">
      {/* hero */}
      <section className="rounded-2xl border bg-primary/5 px-6 py-10 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Santa Cruz Legislative Transparency Portal
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          Access approved municipal ordinances and resolutions, track public
          projects, and share your feedback with the Sangguniang Bayan ng Santa Cruz.
        </p>
        <div className="relative mx-auto mt-6 max-w-xl">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search approved ordinances and resolutions…"
            className="h-11 pl-9"
            aria-label="Search public records"
          />
        </div>
      </section>

      {/* approved records */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck2 className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold">
            Approved &amp; enacted measures
          </h2>
          <Badge variant="secondary">{approved.length}</Badge>
        </div>
        {approved.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No public records match your search.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {approved.map((doc) => (
              <Card key={doc.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {doc.referenceNo}
                    </span>
                    <Badge variant="outline">{doc.category}</Badge>
                  </div>
                  <CardTitle className="text-base leading-snug">
                    {doc.title}
                  </CardTitle>
                  <CardDescription>
                    {authorNames(doc)} · {formatDate(doc.dateFiled)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{doc.summary}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* projects */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold">
            Municipal projects
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {PROJECTS.map((p) => (
            <Card key={p.name}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <Badge variant={PROJECT_STATUS[p.status]}>{p.status}</Badge>
                </div>
                <CardDescription className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {p.municipality} · {p.budget}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* feedback */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Send className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold">Share feedback</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Juan dela Cruz"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Your concern, suggestion, or inquiry…"
                  required
                  rows={4}
                  className={`${inputClass} h-auto py-2`}
                />
              </div>
              <Button type="submit">
                <Send className="size-4" /> Submit feedback
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
