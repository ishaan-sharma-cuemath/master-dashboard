import { EmptyState } from "@/components/home/EmptyState";
import { FolderSection } from "@/components/home/FolderSection";
import { ProjectCard } from "@/components/home/ProjectCard";
import { ViewSwitcher } from "@/components/home/ViewSwitcher";
import { AppShell } from "@/components/shell/AppShell";
import { GraphView } from "@/components/graph/GraphView";
import { needsAttentionSort, orderFolderSection } from "@/lib/derive";
import { applyFilters, hasActiveFilters, type FilterParams } from "@/lib/queries/filters";
import { buildGraphData } from "@/lib/queries/graph";
import { getWorkspace } from "@/lib/queries/projects";

export const dynamic = "force-dynamic";

type HomeParams = FilterParams & { view?: string };

export default async function Home({ searchParams }: { searchParams: Promise<HomeParams> }) {
  const sp = await searchParams;
  const ws = getWorkspace();
  const view = sp.view === "graph" ? "graph" : "list";

  const archiveFolderId = ws.folders.find((f) => f.isSystem === "archive")?.id;
  const active = ws.projects.filter((p) => p.folderId !== archiveFolderId && !p.archivedAt);
  const activeCount = active.filter((p) => p.lifecycle === "in_progress").length;

  const sidebarFolders = ws.folders.map((folder) => ({
    folder,
    count: ws.projects.filter((p) => p.folderId === folder.id).length,
  }));

  const filtered = hasActiveFilters(sp) || sp.folder;

  let content: React.ReactNode;
  if (view === "graph") {
    content = (
      <section className="mt-6">
        <GraphView data={buildGraphData(ws)} />
      </section>
    );
  } else if (filtered) {
    const results = needsAttentionSort(applyFilters(sp.folder ? ws.projects : active, sp));
    content = (
      <section className="mt-7">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[13.5px] font-medium" style={{ color: "var(--ink-secondary)" }}>
            Results
          </h2>
          <span className="text-[12px]" style={{ color: "var(--ink-muted)" }}>
            {results.length}
          </span>
          <a href="/" className="ml-auto text-[12.5px] underline-offset-2 hover:underline" style={{ color: "var(--accent)" }}>
            Clear
          </a>
        </div>
        {results.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No projects match"
              hint="Try removing a filter, or search for something broader."
              action={{ label: "Clear all filters", href: "/" }}
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {results.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
            ))}
          </div>
        )}
      </section>
    );
  } else {
    const sections = ws.folders
      .filter((f) => f.isSystem !== "archive")
      .map((folder) => {
        const members = active.filter((p) => p.folderId === folder.id);
        return { folder, members: orderFolderSection(members, ws.relatedness) };
      })
      .filter((s) => s.members.length > 0);

    content = (
      <div className="mt-7 flex flex-col gap-6">
        {sections.map(({ folder, members }) => (
          <FolderSection key={folder.id} title={folder.name} color={folder.color} count={members.length}>
            {members.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
            ))}
          </FolderSection>
        ))}
        {active.length === 0 && (
          <EmptyState
            title="Set up your first project"
            hint="Track every project's status, stages, and owners in one place."
            action={{ label: "New project", href: "/new" }}
          />
        )}
      </div>
    );
  }

  return (
    <AppShell
      folders={sidebarFolders}
      activeFolderId={sp.folder}
      activeView={sp.lifecycle === "completed" ? "completed" : "all"}
      searchQuery={sp.q}
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[21px] font-semibold tracking-[-0.01em]">Projects</h1>
          <span className="text-[12.5px]" style={{ color: "var(--ink-muted)" }}>
            {ws.projects.length} projects · {activeCount} active
          </span>
          <span className="ml-auto">
            <ViewSwitcher />
          </span>
        </div>
        {content}
      </div>
    </AppShell>
  );
}
