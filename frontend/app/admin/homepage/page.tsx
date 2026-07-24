"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminBadge,
  AdminConfirmDialog,
  AdminField,
  AdminFilterInput,
  AdminFilterSelect,
  AdminPageHeader,
  AdminPanel,
  AdminSectionLabel,
  AdminSubhead,
  AdminSwitch,
  AdminTextArea,
} from "@/components/admin-ui";
import { useToast } from "@/components/toast-provider";
import { uploadAdminMedia } from "@/lib/admin-media-upload";
import { compressImageFile } from "@/lib/image-upload";
import {
  AdminMissingMediaWarning,
  HomepageMediaFrame,
} from "@/components/homepage-media";
import { getHomepageRequiredMediaIssues } from "@/lib/homepage-media";
import {
  defaultHomepageSections,
  getVisibleHomepageCards,
  homepageAudienceLabels,
  homepageSectionTypeLabels,
  homepageTextAlignLabels,
  homepageTextPositionLabels,
  homepageTitleFontSizeLabels,
  sortHomepageRecords,
  type HomepageAudience,
  type HomepageCard,
  type HomepageSection,
  type HomepageSectionType,
  type HomepageTextAlign,
  type HomepageTextPosition,
  type HomepageTitleFontSize,
} from "@/lib/admin-workspace";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";

const sectionTypeOptions = Object.entries(homepageSectionTypeLabels) as Array<
  [HomepageSectionType, string]
>;
const audienceOptions = Object.entries(homepageAudienceLabels) as Array<[HomepageAudience, string]>;
const fontSizeOptions = Object.entries(homepageTitleFontSizeLabels) as Array<
  [HomepageTitleFontSize, string]
>;
const positionOptions = Object.entries(homepageTextPositionLabels) as Array<
  [HomepageTextPosition, string]
>;
const alignmentOptions = Object.entries(homepageTextAlignLabels) as Array<
  [HomepageTextAlign, string]
>;

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function sectionSupportsCards(sectionType: HomepageSectionType) {
  return sectionType === "entry-cards" || sectionType === "category-cards";
}

function normalizeOrder(sections: HomepageSection[]) {
  return sections.map((section, index) => ({
    ...section,
    displayOrder: (index + 1) * 10,
  }));
}

function createCard(section: HomepageSection): HomepageCard {
  const isEntry = section.sectionType === "entry-cards";
  const fallbackLink =
    section.audience === "home"
      ? "/shop"
      : section.audience === "women"
        ? "/collection/women"
        : "/collection/men";
  const fallbackImage =
    "";

  return {
    id: createId("card"),
    title: isEntry ? "Shop Collection" : "New Card",
    subtitle: "",
    ctaText: "",
    ctaLink: fallbackLink,
    image: fallbackImage,
    mobileImage: "",
    imageAlt: "HRUSHE homepage card",
    objectPosition: "center",
    titleFontSize: isEntry ? "large" : "small",
    titlePosition: isEntry ? "bottom-center" : "bottom-right",
    textAlign: isEntry ? "center" : "right",
    isVisible: true,
  };
}

function createSection(sectionType: HomepageSectionType, audience: HomepageAudience): HomepageSection {
  const safeAudience = sectionType === "entry-cards" ? "home" : audience === "home" ? "men" : audience;
  const fallback = defaultHomepageSections.find(
    (section) => section.sectionType === sectionType && section.audience === safeAudience
  );

  if (fallback) {
    return {
      ...fallback,
      id: createId("section"),
      label: `${fallback.label} copy`,
      displayOrder: 999,
      cards: fallback.cards.map((card) => ({ ...card, id: createId("card") })),
    };
  }

  const collectionLink = safeAudience === "women" ? "/collection/women" : "/collection/men";

  return {
    id: createId("section"),
    audience: safeAudience,
    sectionType,
    label: homepageSectionTypeLabels[sectionType],
    title: sectionType === "sale-banner" ? "Sale: New Pieces Added" : "New Homepage Section",
    subtitle: sectionType === "sale-banner" ? "Online Exclusive" : "",
    description: "",
    ctaText: sectionType === "sale-banner" ? "Shop Now" : "",
    ctaLink: collectionLink,
    secondaryCtaText: "",
    secondaryCtaLink: "",
    image: "",
    mobileImage: "",
    imageAlt: "HRUSHE homepage campaign",
    objectPosition: "center",
    backgroundColor: "dark",
    textColor: "light",
    titleFontSize: sectionType === "category-cards" ? "small" : "large",
    titlePosition: sectionType === "category-cards" ? "bottom-right" : "bottom-center",
    textAlign: sectionType === "category-cards" ? "right" : "center",
    cards: [],
    displayOrder: 999,
    isVisible: true,
    publishStart: null,
    publishEnd: null,
  };
}

function hasEmbeddedMedia(value?: string) {
  return /^data:/i.test(String(value || ""));
}

function getSectionPreviewImage(section: HomepageSection) {
  return (
    section.image ||
    section.cards.find((card) => card.image)?.image ||
    ""
  );
}

function HomepageSectionPreview({ section }: { section: HomepageSection }) {
  const visibleCards = getVisibleHomepageCards(section.cards);

  if (sectionSupportsCards(section.sectionType)) {
    return (
      <div className="grid min-h-[260px] grid-cols-2 overflow-hidden bg-[var(--foreground)] text-white lg:grid-cols-4">
        {(visibleCards.length ? visibleCards : section.cards).slice(0, 4).map((card) => (
          <div key={card.id} className="relative min-h-[260px] overflow-hidden">
            <HomepageMediaFrame
              src={card.image || getSectionPreviewImage(section)}
              mobileSrc={card.mobileImage}
              alt={card.imageAlt || card.title}
              sizes="220px"
              className="object-cover"
              objectPosition={card.objectPosition}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_35%,rgba(0,0,0,0.58)_100%)]" />
            <p className="absolute bottom-4 right-4 max-w-[10rem] text-right text-[0.72rem] font-medium uppercase tracking-[0.08em]">
              {card.title}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative min-h-[360px] overflow-hidden bg-[var(--foreground)] text-white">
      <HomepageMediaFrame
        src={getSectionPreviewImage(section)}
        mobileSrc={section.mobileImage}
        alt={section.imageAlt || section.title}
        sizes="720px"
        className="object-cover"
        objectPosition={section.objectPosition}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_20%,rgba(0,0,0,0.54)_100%)]" />
      <div className="absolute inset-x-0 bottom-8 px-6 text-center">
        <h3 className="text-3xl font-bold uppercase leading-none tracking-tight">{section.title}</h3>
        {section.subtitle ? (
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.12em]">{section.subtitle}</p>
        ) : null}
        {section.ctaText ? (
          <p className="mt-5 text-xs font-medium uppercase tracking-[0.16em]">{section.ctaText} ›</p>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminHomepagePage() {
  const { workspace, saveWorkspace } = useAdminWorkspace();
  const { pushToast } = useToast();
  const [draftSections, setDraftSections] = useState<HomepageSection[] | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [draggedSectionId, setDraggedSectionId] = useState("");
  const [draggedCardId, setDraggedCardId] = useState("");
  const [newSectionType, setNewSectionType] = useState<HomepageSectionType>("category-cards");
  const [newSectionAudience, setNewSectionAudience] = useState<HomepageAudience>("men");
  const [publishOpen, setPublishOpen] = useState(false);
  const [deleteSectionOpen, setDeleteSectionOpen] = useState(false);

  const sections = sortHomepageRecords(draftSections || workspace.homeManagement.sections);
  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedSectionId) || sections[0] || null,
    [sections, selectedSectionId]
  );
  const selectedCard = useMemo(
    () =>
      selectedSection?.cards.find((card) => card.id === selectedCardId) ||
      selectedSection?.cards[0] ||
      null,
    [selectedCardId, selectedSection]
  );
  const mediaIssues = useMemo(
    () => getHomepageRequiredMediaIssues(sections, { mediaLibrary: workspace.mediaLibrary }),
    [sections, workspace.mediaLibrary]
  );

  function updateDraftSections(updater: (current: HomepageSection[]) => HomepageSection[]) {
    setDraftSections((current) => normalizeOrder(updater(current || workspace.homeManagement.sections)));
  }

  function updateSelectedSection(patch: Partial<HomepageSection>) {
    if (!selectedSection) {
      return;
    }

    updateDraftSections((current) =>
      current.map((section) =>
        section.id === selectedSection.id ? { ...section, ...patch } : section
      )
    );
  }

  function updateSelectedCard(patch: Partial<HomepageCard>) {
    if (!selectedSection || !selectedCard) {
      return;
    }

    updateDraftSections((current) =>
      current.map((section) =>
        section.id === selectedSection.id
          ? {
              ...section,
              cards: section.cards.map((card) =>
                card.id === selectedCard.id ? { ...card, ...patch } : card
              ),
            }
          : section
      )
    );
  }

  function selectSection(section: HomepageSection) {
    setSelectedSectionId(section.id);
    setSelectedCardId(section.cards[0]?.id || "");
  }

  function addSection() {
    const section = createSection(newSectionType, newSectionAudience);
    if (sectionSupportsCards(section.sectionType) && section.cards.length === 0) {
      section.cards = [createCard(section)];
    }

    updateDraftSections((current) => [...current, section]);
    setSelectedSectionId(section.id);
    setSelectedCardId(section.cards[0]?.id || "");
  }

  function duplicateSelectedSection() {
    if (!selectedSection) {
      return;
    }

    const section = {
      ...selectedSection,
      id: createId("section"),
      label: `${selectedSection.label || selectedSection.title} copy`,
      cards: selectedSection.cards.map((card) => ({ ...card, id: createId("card") })),
    };

    updateDraftSections((current) => {
      const index = current.findIndex((item) => item.id === selectedSection.id);
      const next = [...current];
      next.splice(index + 1, 0, section);
      return next;
    });
    setSelectedSectionId(section.id);
    setSelectedCardId(section.cards[0]?.id || "");
    pushToast("Section duplicated into the draft.");
  }

  function deleteSelectedSection() {
    if (!selectedSection) {
      return;
    }

    const remaining = sections.filter((section) => section.id !== selectedSection.id);
    setDraftSections(normalizeOrder(remaining));
    setSelectedSectionId(remaining[0]?.id || "");
    setSelectedCardId(remaining[0]?.cards[0]?.id || "");
    setDeleteSectionOpen(false);
    pushToast("Section removed from the draft.");
  }

  function moveSection(targetId: string) {
    if (!draggedSectionId || draggedSectionId === targetId) {
      return;
    }

    updateDraftSections((current) => {
      const fromIndex = current.findIndex((section) => section.id === draggedSectionId);
      const toIndex = current.findIndex((section) => section.id === targetId);
      if (fromIndex < 0 || toIndex < 0) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function addCard() {
    if (!selectedSection) {
      return;
    }

    const card = createCard(selectedSection);
    updateSelectedSection({ cards: [...selectedSection.cards, card] });
    setSelectedCardId(card.id);
    pushToast("Card added to the draft.");
  }

  function duplicateSelectedCard() {
    if (!selectedSection || !selectedCard) {
      return;
    }

    const card = { ...selectedCard, id: createId("card"), title: `${selectedCard.title} Copy` };
    updateSelectedSection({ cards: [...selectedSection.cards, card] });
    setSelectedCardId(card.id);
    pushToast("Card duplicated.");
  }

  function deleteSelectedCard() {
    if (!selectedSection || !selectedCard) {
      return;
    }

    const cards = selectedSection.cards.filter((card) => card.id !== selectedCard.id);
    updateSelectedSection({ cards });
    setSelectedCardId(cards[0]?.id || "");
    pushToast("Card removed from the draft.");
  }

  function moveCard(targetId: string) {
    if (!selectedSection || !draggedCardId || draggedCardId === targetId) {
      return;
    }

    const fromIndex = selectedSection.cards.findIndex((card) => card.id === draggedCardId);
    const toIndex = selectedSection.cards.findIndex((card) => card.id === targetId);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    const cards = [...selectedSection.cards];
    const [moved] = cards.splice(fromIndex, 1);
    cards.splice(toIndex, 0, moved);
    updateSelectedSection({ cards });
  }

  async function uploadImage(file: File, width = 1600) {
    const optimizedFile = await compressImageFile(file, width);
    return uploadAdminMedia(optimizedFile);
  }

  async function handleSectionImageUpload(
    event: ChangeEvent<HTMLInputElement>,
    field: "image" | "mobileImage"
  ) {
    const file = event.target.files?.[0];
    if (!file || !selectedSection) {
      return;
    }

    try {
      const uploadedMedia = await uploadImage(file, field === "mobileImage" ? 900 : 1600);
      updateSelectedSection({ [field]: uploadedMedia.url });
      pushToast(field === "mobileImage" ? "Mobile section image uploaded." : "Section image uploaded.");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not upload that image.", "error");
    } finally {
      event.target.value = "";
    }
  }

  async function handleCardImageUpload(
    event: ChangeEvent<HTMLInputElement>,
    field: "image" | "mobileImage"
  ) {
    const file = event.target.files?.[0];
    if (!file || !selectedCard) {
      return;
    }

    try {
      const uploadedMedia = await uploadImage(file, field === "mobileImage" ? 900 : 1400);
      updateSelectedCard({ [field]: uploadedMedia.url });
      pushToast(field === "mobileImage" ? "Mobile card image uploaded." : "Card image uploaded.");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not upload that image.", "error");
    } finally {
      event.target.value = "";
    }
  }

  async function publishChanges() {
    const nextSections = normalizeOrder(sections);
    const embeddedMedia = nextSections.some((section) =>
      [section.image, section.mobileImage, ...section.cards.flatMap((card) => [card.image, card.mobileImage])].some(
        hasEmbeddedMedia
      )
    );

    if (embeddedMedia) {
      pushToast("Upload images before publishing. Embedded image data cannot be stored.", "error");
      setPublishOpen(false);
      return;
    }

    if (
      nextSections.some(
        (section) =>
          section.isVisible &&
          sectionSupportsCards(section.sectionType) &&
          getVisibleHomepageCards(section.cards).length === 0
      )
    ) {
      pushToast("Visible card sections need at least one visible card.", "error");
      setPublishOpen(false);
      return;
    }

    const blockingMediaIssues = getHomepageRequiredMediaIssues(nextSections, {
      mediaLibrary: workspace.mediaLibrary,
    });
    if (blockingMediaIssues.length > 0) {
      pushToast("Add approved homepage media before publishing.", "error");
      setPublishOpen(false);
      return;
    }

    try {
      await saveWorkspace({
        homeManagement: {
          banners: workspace.homeManagement.banners,
          sections: nextSections,
          lastPublishedAt: new Date().toISOString(),
        },
      });
      setDraftSections(null);
      pushToast("Homepage sections published.");
      setPublishOpen(false);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not publish homepage sections.", "error");
      setPublishOpen(false);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Homepage management"
          title="Manage sections and cards."
          description="Edit the existing homepage sections with approved presets only: images, titles, links, visibility, order, card font size, and card title position."
          actions={
            <button
              type="button"
              onClick={() => setPublishOpen(true)}
              className="button-primary px-5 py-3 text-sm font-medium"
            >
              Save and publish
            </button>
          }
        />

        <AdminMissingMediaWarning issues={mediaIssues} />

        <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.75fr)_minmax(0,1.25fr)]">
          <AdminPanel>
            <AdminSubhead
              title="Sections"
              description="Drag to reorder. The same approved storefront components render on the live site."
            />

            <div className="mb-5 grid gap-3 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] p-4">
              <AdminSectionLabel>Add section</AdminSectionLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                <AdminField label="Section type">
                  <AdminFilterSelect
                    value={newSectionType}
                    onChange={(event) => setNewSectionType(event.target.value as HomepageSectionType)}
                  >
                    {sectionTypeOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </AdminFilterSelect>
                </AdminField>
                <AdminField label="Page">
                  <AdminFilterSelect
                    value={newSectionType === "entry-cards" ? "home" : newSectionAudience}
                    disabled={newSectionType === "entry-cards"}
                    onChange={(event) => setNewSectionAudience(event.target.value as HomepageAudience)}
                  >
                    {audienceOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </AdminFilterSelect>
                </AdminField>
              </div>
              <button type="button" onClick={addSection} className="button-secondary px-4 py-3 text-sm font-medium">
                Add section
              </button>
            </div>

            <div className="space-y-3">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  draggable
                  onDragStart={() => setDraggedSectionId(section.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => moveSection(section.id)}
                  onClick={() => selectSection(section)}
                  className={`flex w-full items-start gap-4 border px-4 py-4 text-left transition ${
                    selectedSection?.id === section.id
                      ? "border-[var(--foreground)] bg-[color:color-mix(in_srgb,var(--foreground)_5%,transparent)]"
                      : "border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,transparent)]"
                  }`}
                >
                  <span className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">Drag</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{section.label || section.title}</p>
                      <AdminBadge tone={section.isVisible ? "success" : "warning"}>
                        {section.isVisible ? "Visible" : "Hidden"}
                      </AdminBadge>
                    </div>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {homepageAudienceLabels[section.audience]} · {homepageSectionTypeLabels[section.sectionType]}
                      {sectionSupportsCards(section.sectionType) ? ` · ${section.cards.length} cards` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4">
              <AdminSectionLabel>Publish status</AdminSectionLabel>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Last published{" "}
                {workspace.homeManagement.lastPublishedAt
                  ? new Date(workspace.homeManagement.lastPublishedAt).toLocaleString("en-IN")
                  : "never"}.
              </p>
            </div>
          </AdminPanel>

          <div className="space-y-5">
            <AdminPanel>
              <AdminSubhead
                title="Section editor"
                description="Only approved layout, typography, and position presets are available."
                action={
                  selectedSection ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={duplicateSelectedSection}
                        className="px-4 py-2 text-xs font-medium uppercase tracking-[0.18em]"
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteSectionOpen(true)}
                        className="px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--danger)]"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null
                }
              />

              {selectedSection ? (
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <AdminField label="Admin label">
                      <AdminFilterInput
                        value={selectedSection.label}
                        onChange={(event) => updateSelectedSection({ label: event.target.value })}
                      />
                    </AdminField>
                    <AdminField label="Page">
                      <AdminFilterSelect
                        value={selectedSection.audience}
                        disabled={selectedSection.sectionType === "entry-cards"}
                        onChange={(event) =>
                          updateSelectedSection({ audience: event.target.value as HomepageAudience })
                        }
                      >
                        {audienceOptions.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </AdminFilterSelect>
                    </AdminField>
                    <AdminField label="Section type">
                      <AdminFilterSelect
                        value={selectedSection.sectionType}
                        onChange={(event) =>
                          updateSelectedSection({ sectionType: event.target.value as HomepageSectionType })
                        }
                      >
                        {sectionTypeOptions.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </AdminFilterSelect>
                    </AdminField>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <AdminSwitch
                      checked={selectedSection.isVisible}
                      onChange={(checked) => updateSelectedSection({ isVisible: checked })}
                      label="Show section"
                      description="Hidden sections stay saved but do not render on the storefront."
                    />
                    <AdminField label="Object position" hint="Examples: center, top, left center, 40% 50%.">
                      <AdminFilterInput
                        value={selectedSection.objectPosition}
                        onChange={(event) => updateSelectedSection({ objectPosition: event.target.value })}
                      />
                    </AdminField>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <AdminField label="Title">
                      <AdminFilterInput
                        value={selectedSection.title}
                        onChange={(event) => updateSelectedSection({ title: event.target.value })}
                      />
                    </AdminField>
                    <AdminField label={selectedSection.sectionType === "sale-banner" ? "Subtitle / discount text" : "Subtitle"}>
                      <AdminFilterInput
                        value={selectedSection.subtitle}
                        onChange={(event) => updateSelectedSection({ subtitle: event.target.value })}
                      />
                    </AdminField>
                  </div>

                  {!sectionSupportsCards(selectedSection.sectionType) ? (
                    <>
                      <AdminField label="Description">
                        <AdminTextArea
                          value={selectedSection.description}
                          onChange={(event) => updateSelectedSection({ description: event.target.value })}
                        />
                      </AdminField>

                      <div className="grid gap-4 md:grid-cols-2">
                        <AdminField label="CTA text">
                          <AdminFilterInput
                            value={selectedSection.ctaText}
                            onChange={(event) => updateSelectedSection({ ctaText: event.target.value })}
                          />
                        </AdminField>
                        <AdminField label="CTA link">
                          <AdminFilterInput
                            value={selectedSection.ctaLink}
                            onChange={(event) => updateSelectedSection({ ctaLink: event.target.value })}
                          />
                        </AdminField>
                      </div>

                      {selectedSection.sectionType === "audience-hero" ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          <AdminField label="Secondary CTA text">
                            <AdminFilterInput
                              value={selectedSection.secondaryCtaText}
                              onChange={(event) =>
                                updateSelectedSection({ secondaryCtaText: event.target.value })
                              }
                            />
                          </AdminField>
                          <AdminField label="Secondary CTA link">
                            <AdminFilterInput
                              value={selectedSection.secondaryCtaLink}
                              onChange={(event) =>
                                updateSelectedSection({ secondaryCtaLink: event.target.value })
                              }
                            />
                          </AdminField>
                        </div>
                      ) : null}

                      <div className="grid gap-4 md:grid-cols-2">
                        <AdminField label="Desktop image">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => void handleSectionImageUpload(event, "image")}
                            className="block w-full text-sm text-[var(--muted)] file:mr-4 file:border-0 file:bg-[var(--foreground)] file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-[var(--background)]"
                          />
                        </AdminField>
                        <AdminField label="Desktop image URL">
                          <AdminFilterInput
                            value={selectedSection.image}
                            onChange={(event) => updateSelectedSection({ image: event.target.value })}
                          />
                        </AdminField>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <AdminField label="Mobile image">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => void handleSectionImageUpload(event, "mobileImage")}
                            className="block w-full text-sm text-[var(--muted)] file:mr-4 file:border-0 file:bg-[var(--foreground)] file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-[var(--background)]"
                          />
                        </AdminField>
                        <AdminField label="Mobile image URL">
                          <AdminFilterInput
                            value={selectedSection.mobileImage}
                            onChange={(event) => updateSelectedSection({ mobileImage: event.target.value })}
                          />
                        </AdminField>
                      </div>

                      <AdminField label="Image alt text">
                        <AdminFilterInput
                          value={selectedSection.imageAlt}
                          onChange={(event) => updateSelectedSection({ imageAlt: event.target.value })}
                        />
                      </AdminField>
                    </>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2">
                    <AdminField label="Publish start">
                      <AdminFilterInput
                        type="datetime-local"
                        value={selectedSection.publishStart?.slice(0, 16) || ""}
                        onChange={(event) =>
                          updateSelectedSection({
                            publishStart: event.target.value
                              ? new Date(event.target.value).toISOString()
                              : null,
                          })
                        }
                      />
                    </AdminField>
                    <AdminField label="Publish end">
                      <AdminFilterInput
                        type="datetime-local"
                        value={selectedSection.publishEnd?.slice(0, 16) || ""}
                        onChange={(event) =>
                          updateSelectedSection({
                            publishEnd: event.target.value
                              ? new Date(event.target.value).toISOString()
                              : null,
                          })
                        }
                      />
                    </AdminField>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--muted)]">Select a section to edit.</p>
              )}
            </AdminPanel>

            {selectedSection && sectionSupportsCards(selectedSection.sectionType) ? (
              <AdminPanel>
                <AdminSubhead
                  title="Cards"
                  description="Edit image, title, link, font size, alignment, and title position for each card."
                  action={
                    <button type="button" onClick={addCard} className="button-secondary px-4 py-2 text-xs font-medium">
                      Add card
                    </button>
                  }
                />

                <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                  <div className="space-y-2">
                    {selectedSection.cards.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        draggable
                        onDragStart={() => setDraggedCardId(card.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => moveCard(card.id)}
                        onClick={() => setSelectedCardId(card.id)}
                        className={`flex w-full items-center gap-3 border px-3 py-3 text-left transition ${
                          selectedCard?.id === card.id
                            ? "border-[var(--foreground)] bg-[color:color-mix(in_srgb,var(--foreground)_5%,transparent)]"
                            : "border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)]"
                        }`}
                      >
                        <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Drag</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{card.title}</span>
                        <AdminBadge tone={card.isVisible ? "success" : "warning"}>
                          {card.isVisible ? "On" : "Off"}
                        </AdminBadge>
                      </button>
                    ))}
                  </div>

                  {selectedCard ? (
                    <div className="space-y-5">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={duplicateSelectedCard}
                          className="px-4 py-2 text-xs font-medium uppercase tracking-[0.18em]"
                        >
                          Duplicate card
                        </button>
                        <button
                          type="button"
                          onClick={deleteSelectedCard}
                          className="px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--danger)]"
                        >
                          Delete card
                        </button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <AdminField label="Card title">
                          <AdminFilterInput
                            value={selectedCard.title}
                            onChange={(event) => updateSelectedCard({ title: event.target.value })}
                          />
                        </AdminField>
                        <AdminField label="Subtitle / side label">
                          <AdminFilterInput
                            value={selectedCard.subtitle}
                            onChange={(event) => updateSelectedCard({ subtitle: event.target.value })}
                          />
                        </AdminField>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <AdminField label="CTA text">
                          <AdminFilterInput
                            value={selectedCard.ctaText}
                            onChange={(event) => updateSelectedCard({ ctaText: event.target.value })}
                          />
                        </AdminField>
                        <AdminField label="CTA link">
                          <AdminFilterInput
                            value={selectedCard.ctaLink}
                            onChange={(event) => updateSelectedCard({ ctaLink: event.target.value })}
                          />
                        </AdminField>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <AdminField label="Title font size">
                          <AdminFilterSelect
                            value={selectedCard.titleFontSize}
                            onChange={(event) =>
                              updateSelectedCard({ titleFontSize: event.target.value as HomepageTitleFontSize })
                            }
                          >
                            {fontSizeOptions.map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </AdminFilterSelect>
                        </AdminField>
                        <AdminField label="Title position">
                          <AdminFilterSelect
                            value={selectedCard.titlePosition}
                            onChange={(event) =>
                              updateSelectedCard({ titlePosition: event.target.value as HomepageTextPosition })
                            }
                          >
                            {positionOptions.map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </AdminFilterSelect>
                        </AdminField>
                        <AdminField label="Text alignment">
                          <AdminFilterSelect
                            value={selectedCard.textAlign}
                            onChange={(event) =>
                              updateSelectedCard({ textAlign: event.target.value as HomepageTextAlign })
                            }
                          >
                            {alignmentOptions.map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </AdminFilterSelect>
                        </AdminField>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <AdminField label="Desktop card image">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => void handleCardImageUpload(event, "image")}
                            className="block w-full text-sm text-[var(--muted)] file:mr-4 file:border-0 file:bg-[var(--foreground)] file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-[var(--background)]"
                          />
                        </AdminField>
                        <AdminField label="Desktop card image URL">
                          <AdminFilterInput
                            value={selectedCard.image}
                            onChange={(event) => updateSelectedCard({ image: event.target.value })}
                          />
                        </AdminField>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <AdminField label="Mobile card image">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => void handleCardImageUpload(event, "mobileImage")}
                            className="block w-full text-sm text-[var(--muted)] file:mr-4 file:border-0 file:bg-[var(--foreground)] file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-[var(--background)]"
                          />
                        </AdminField>
                        <AdminField label="Mobile card image URL">
                          <AdminFilterInput
                            value={selectedCard.mobileImage}
                            onChange={(event) => updateSelectedCard({ mobileImage: event.target.value })}
                          />
                        </AdminField>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <AdminField label="Image alt text">
                          <AdminFilterInput
                            value={selectedCard.imageAlt}
                            onChange={(event) => updateSelectedCard({ imageAlt: event.target.value })}
                          />
                        </AdminField>
                        <AdminField label="Image crop position">
                          <AdminFilterInput
                            value={selectedCard.objectPosition}
                            onChange={(event) => updateSelectedCard({ objectPosition: event.target.value })}
                          />
                        </AdminField>
                      </div>

                      <AdminSwitch
                        checked={selectedCard.isVisible}
                        onChange={(checked) => updateSelectedCard({ isVisible: checked })}
                        label="Show card"
                        description="Hidden cards remain saved but do not render in the storefront card rail."
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--muted)]">Add a card to start editing.</p>
                  )}
                </div>
              </AdminPanel>
            ) : null}

            {selectedSection ? (
              <AdminPanel>
                <AdminSubhead title="Preview" description="A compact preview of the selected approved section design." />
                <HomepageSectionPreview section={selectedSection} />
              </AdminPanel>
            ) : null}
          </div>
        </div>

        <AdminConfirmDialog
          open={publishOpen}
          title="Publish homepage section changes?"
          description="This will update section order, visibility, card images, card titles, and sale timing on the storefront."
          confirmLabel="Publish now"
          onConfirm={() => void publishChanges()}
          onCancel={() => setPublishOpen(false)}
        />

        <AdminConfirmDialog
          open={deleteSectionOpen}
          title="Delete this section draft?"
          description="This removes the selected section from the homepage draft. Publish after reviewing the new section order."
          confirmLabel="Delete section"
          destructive
          onConfirm={deleteSelectedSection}
          onCancel={() => setDeleteSectionOpen(false)}
        />
      </div>
    </AdminShell>
  );
}
