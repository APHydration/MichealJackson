"use server";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { toMoneyNumber } from "@/lib/utils";
import { resolveChannelId } from "@/lib/youtube";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readNullableString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value || null;
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function revalidatePortalPages() {
  revalidatePath("/dashboard");
  revalidatePath("/creators");
  revalidatePath("/campaigns");
  revalidatePath("/videos");
  revalidatePath("/weekly-payouts");
  revalidatePath("/settings");
}

async function buildCreatorPayload(formData: FormData) {
  const name = readString(formData, "name");
  const email = readNullableString(formData, "email");
  const campaignId = readNullableString(formData, "campaignId");
  const youtubeChannelUrl = readNullableString(formData, "youtubeChannelUrl");
  let youtubeChannelId = readNullableString(formData, "youtubeChannelId");
  const instagramHandle = readNullableString(formData, "instagramHandle");
  const tiktokHandle = readNullableString(formData, "tiktokHandle");
  const paymentNotes = readNullableString(formData, "paymentNotes");
  const ratePerShort = toMoneyNumber(readString(formData, "ratePerShort"));
  const active = readBoolean(formData, "active");

  if (!name) {
    throw new Error("Creator name is required.");
  }

  if (!youtubeChannelId && !youtubeChannelUrl) {
    throw new Error("A YouTube channel ID or URL is required.");
  }

  if (!youtubeChannelId && youtubeChannelUrl) {
    youtubeChannelId = await resolveChannelId(youtubeChannelUrl);
  }

  return {
    name,
    email,
    campaign_id: campaignId,
    youtube_channel_url: youtubeChannelUrl,
    youtube_channel_id: youtubeChannelId,
    instagram_handle: instagramHandle,
    tiktok_handle: tiktokHandle,
    payment_notes: paymentNotes,
    rate_per_short: ratePerShort,
    active,
  };
}

export async function signOutAction() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createCampaignAction(formData: FormData) {
  await requireUser();
  const supabase = createAdminClient();
  const name = readString(formData, "name");
  const description = readNullableString(formData, "description");
  const active = readBoolean(formData, "active");

  if (!name) {
    throw new Error("Campaign name is required.");
  }

  const { error } = await supabase.from("campaigns").insert({
    name,
    description,
    active,
  });

  if (error) {
    throw error;
  }

  revalidatePortalPages();
  redirect("/campaigns");
}

export async function updateCampaignAction(formData: FormData) {
  await requireUser();
  const supabase = createAdminClient();
  const id = readString(formData, "id");
  const name = readString(formData, "name");
  const description = readNullableString(formData, "description");
  const active = readBoolean(formData, "active");

  const { error } = await supabase
    .from("campaigns")
    .update({
      name,
      description,
      active,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }

  revalidatePortalPages();
  redirect(`/campaigns/${id}`);
}

export async function deleteCampaignAction(formData: FormData) {
  await requireUser();
  const supabase = createAdminClient();
  const id = readString(formData, "id");

  const { error } = await supabase.from("campaigns").delete().eq("id", id);

  if (error) {
    throw error;
  }

  revalidatePortalPages();
  redirect("/campaigns");
}

export async function createCreatorAction(formData: FormData) {
  await requireUser();
  const supabase = createAdminClient();
  const payload = await buildCreatorPayload(formData);

  const { error } = await supabase.from("creators").insert(payload);

  if (error) {
    throw error;
  }

  revalidatePortalPages();
  redirect("/creators");
}

export async function updateCreatorAction(formData: FormData) {
  await requireUser();
  const supabase = createAdminClient();
  const id = readString(formData, "id");
  const payload = await buildCreatorPayload(formData);

  const { error } = await supabase.from("creators").update(payload).eq("id", id);

  if (error) {
    throw error;
  }

  revalidatePortalPages();
  redirect(`/creators/${id}`);
}

export async function deleteCreatorAction(formData: FormData) {
  await requireUser();
  const supabase = createAdminClient();
  const id = readString(formData, "id");

  const { error } = await supabase.from("creators").delete().eq("id", id);

  if (error) {
    throw error;
  }

  revalidatePortalPages();
  redirect("/creators");
}

export async function updatePayoutStatusAction(formData: FormData) {
  await requireUser();
  const supabase = createAdminClient();
  const payoutId = readString(formData, "payoutId");
  const nextStatus = readString(formData, "nextStatus") === "paid" ? "paid" : "unpaid";
  const redirectTo = readString(formData, "redirectTo") || "/weekly-payouts";

  const { error } = await supabase
    .from("weekly_payouts")
    .update({
      status: nextStatus,
      paid_date: nextStatus === "paid" ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq("id", payoutId);

  if (error) {
    throw error;
  }

  revalidatePortalPages();
  redirect(redirectTo);
}

export async function updatePayoutNotesAction(formData: FormData) {
  await requireUser();
  const supabase = createAdminClient();
  const payoutId = readString(formData, "payoutId");
  const notes = readNullableString(formData, "notes");
  const redirectTo = readString(formData, "redirectTo") || "/weekly-payouts";

  const { error } = await supabase.from("weekly_payouts").update({ notes }).eq("id", payoutId);

  if (error) {
    throw error;
  }

  revalidatePortalPages();
  redirect(redirectTo);
}
