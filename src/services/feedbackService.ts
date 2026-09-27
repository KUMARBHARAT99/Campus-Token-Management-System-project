import { getSupabase } from './supabaseClient';

export type FeedbackType =
  | 'problem'
  | 'token_issue'
  | 'payment_issue'
  | 'suggestion'
  | 'other';

export interface FeedbackInput {
  type: FeedbackType;
  description: string;
  tokenId?: string;
  image?: File | null;
}

export interface FeedbackRow {
  id: string;
  user_id: string;
  feedback_type: FeedbackType;
  description: string | null;
  token_id: string | null;
  image_path: string | null;
  submitter_name?: string | null;
  submitter_email?: string | null;
  created_at: string;
  user_name?: string | null;
  user_email?: string | null;
  user_role?: string | null;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function submitFeedback(input: FeedbackInput): Promise<FeedbackRow> {
  const supabase = getSupabase();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(sessionError.message);
  const user = sessionData.session?.user;
  if (!user) throw new Error('Your session has expired. Please login again.');

  const description = input.description?.trim() || null;
  const tokenId = input.tokenId?.trim().toUpperCase() || null;

  if (!description) {
    throw new Error('Please describe the issue before submitting feedback.');
  }

  let imagePath: string | null = null;

  if (input.image) {
    if (!ALLOWED_TYPES.has(input.image.type)) {
      throw new Error('Please upload a JPG, PNG or WEBP image.');
    }
    if (input.image.size > MAX_IMAGE_BYTES) {
      throw new Error('Image must be 5 MB or smaller.');
    }

    const extension = input.image.type === 'image/png'
      ? 'png'
      : input.image.type === 'image/webp'
        ? 'webp'
        : 'jpg';
    imagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('feedback-images')
      .upload(imagePath, input.image, {
        contentType: input.image.type,
        upsert: false,
      });

    if (uploadError) throw new Error('Screenshot could not be uploaded. Please try again.');
  }

  const { data, error } = await supabase
    .from('feedback')
    .insert({
      user_id: user.id,
      feedback_type: input.type,
      description,
      token_id: tokenId,
      image_path: imagePath,
    })
    .select('*')
    .single();

  if (error) {
    if (imagePath) {
      await supabase.storage.from('feedback-images').remove([imagePath]);
    }
    throw new Error(error.message);
  }

  return data as FeedbackRow;
}

export async function getFeedback(): Promise<FeedbackRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);

  const rows = ((data ?? []) as Array<FeedbackRow & { user_id: string | null }>).map((row) => ({ ...row, user_id: row.user_id ?? '' }));
  const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))];
  if (!userIds.length) return rows;

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id,full_name,email,role')
    .in('id', userIds);

  if (profilesError) return rows;
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id as string, profile]));
  return rows.map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      ...row,
      user_name: (profile?.full_name as string | undefined) ?? null,
      user_email: (profile?.email as string | undefined) ?? null,
      user_role: (profile?.role as string | undefined) ?? null,
    };
  });
}

export async function getFeedbackImageUrl(path: string): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from('feedback-images')
    .createSignedUrl(path, 60 * 10);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? 'Unable to load screenshot.');
  }
  return data.signedUrl;
}

export const FEEDBACK_TYPE_LABEL: Record<FeedbackType, string> = {
  problem: 'Problem / Bug',
  token_issue: 'Token Issue',
  payment_issue: 'Payment Issue',
  suggestion: 'Suggestion',
  other: 'Other',
};
