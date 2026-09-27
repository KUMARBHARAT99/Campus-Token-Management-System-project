// Supabase authentication service.
// Uses Supabase Auth for identity; profile data lives in `profiles`.

import type { SignUpData, User } from '@/types';
import { getSupabase } from './supabaseClient';

function mapProfile(row: Record<string, unknown>): User {
  return {
    id: row.id as string,

    full_name:
      (row.full_name as string) ??
      '',

    email:
      (row.email as string) ??
      '',

    mobile:
      (row.mobile as string) ??
      '',

    role:
      (row.role as User['role']) ??
      'student',

    account_status:
      (row.account_status as User['account_status']) ??
      'pending_approval',

    student_id:
      (row.student_id as string) ??
      undefined,

    department:
      (row.department as string) ??
      undefined,

    semester:
      (row.semester as number) ??
      undefined,

    staff_id:
      (row.staff_id as string) ??
      undefined,

    designation:
      (row.designation as string) ??
      undefined,

    organization:
      (row.organization as string) ??
      undefined,

    program:
      (row.program as string) ??
      undefined,

    batch:
      (row.batch as string) ??
      undefined,

    college:
      (row.college as string) ??
      undefined,

    gender:
      (row.gender as string) ??
      undefined,

    date_of_birth:
      (row.date_of_birth as string) ??
      undefined,

    city:
      (row.city as string) ??
      undefined,

    bio:
      (row.bio as string) ??
      undefined,

    avatar_url:
      (row.avatar_url as string) ??
      undefined,

    id_card_image:
      (row.id_card_image as string) ??
      undefined,

    show_photo_on_token:
      row.show_photo_on_token !== false,

    show_name_on_token:
      row.show_name_on_token !== false,

    show_public_details:
      row.show_public_details === true,

    requested_role:
      (row.requested_role as User['role']) ??
      undefined,

    created_at:
      (row.created_at as string) ??
      new Date().toISOString(),

    updated_at:
      (row.updated_at as string) ??
      undefined,
  };
}


export const supabaseAuthService = {

  /* ==========================================================
     MODE
  ========================================================== */

  isMockMode(): boolean {
    return false;
  },


  /* ==========================================================
     ADMIN EMAIL
  ========================================================== */

  getAdminEmail(): string {
    return 'kumarbharat.ac.in@gmail.com';
  },


  /* ==========================================================
     SIGN UP
  ========================================================== */

  async signUp(
    data: SignUpData
  ): Promise<User> {

    const supabase = getSupabase();

    const requestedRole =
      data.role === 'admin' ||
      data.role === 'security'
        ? 'other'
        : data.role;


    const email =
      data.email
        .trim()
        .toLowerCase();


    /* ----------------------------------------------------------
       CREATE SUPABASE AUTH USER
    ---------------------------------------------------------- */

    const {
      data: authData,
      error,
    } =
      await supabase.auth.signUp({
        email,
        password: data.password,

        options: {

          emailRedirectTo:
            `${window.location.origin}/login`,

          data: {

            full_name:
              data.full_name,

            mobile:
              data.mobile,

            role:
              requestedRole,

            requested_role:
              data.requested_role ??
              requestedRole,

            student_id:
              data.student_id ??
              null,

            department:
              data.department ??
              null,

            semester:
              data.semester ??
              null,

            staff_id:
              data.staff_id ??
              null,

            designation:
              data.designation ??
              null,

            organization:
              data.organization ??
              null,

            program:
              data.program ??
              null,

            college:
              data.college ??
              null,

            batch:
              data.batch ??
              null,

            gender:
              data.gender ??
              null,

            date_of_birth:
              data.date_of_birth ??
              null,

            city:
              data.city ??
              null,

            bio:
              data.bio ??
              null,

            avatar_url:
              data.avatar_url ??
              null,

            id_card_image:
              data.id_card_image ??
              null,

            show_photo_on_token:
              data.show_photo_on_token ??
              true,

            show_name_on_token:
              data.show_name_on_token ??
              true,

            show_public_details:
              data.show_public_details ??
              false,
          },
        },
      });


    /* ----------------------------------------------------------
       AUTH ERROR
    ---------------------------------------------------------- */

    if (error) {
      throw new Error(error.message);
    }


    if (!authData.user) {
      throw new Error(
        'Sign up failed — no user was returned by Supabase.'
      );
    }


    /* ----------------------------------------------------------
       IMPORTANT
       ----------------------------------------------------------

       DO NOT immediately call fetchProfile() here.

       When email confirmation is enabled:
       
       Auth user may exist
       but session may be null.

       The signup page will now continue to the
       email verification screen normally.
    ---------------------------------------------------------- */

    return {

      id:
        authData.user.id,

      full_name:
        data.full_name,

      email:
        email,

      mobile:
        data.mobile,

      role:
        requestedRole as User['role'],

      account_status:
        'pending_approval',

      student_id:
        data.student_id,

      department:
        data.department,

      semester:
        data.semester,

      staff_id:
        data.staff_id,

      designation:
        data.designation,

      organization:
        data.organization,

      program:
        data.program,

      college:
        data.college,

      batch:
        data.batch,

      gender:
        data.gender,

      date_of_birth:
        data.date_of_birth,

      city:
        data.city,

      bio:
        data.bio,

      avatar_url:
        data.avatar_url,

      id_card_image:
        data.id_card_image,

      show_photo_on_token:
        data.show_photo_on_token ??
        true,

      show_name_on_token:
        data.show_name_on_token ??
        true,

      show_public_details:
        data.show_public_details ??
        false,

      requested_role:
        data.requested_role as User['role'],

      created_at:
        new Date().toISOString(),
    };
  },


  /* ==========================================================
     SIGN IN
  ========================================================== */

  async signIn(
    email: string,
    password: string
  ): Promise<User> {

    const supabase = getSupabase();

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();


    const {
      data,
      error,
    } =
      await supabase.auth.signInWithPassword({
        email:
          normalizedEmail,

        password,
      });


    if (error) {
      throw new Error(error.message);
    }


    if (!data.user) {
      throw new Error(
        'Login failed — no user returned.'
      );
    }


    /* ----------------------------------------------------------
       EMAIL NOT VERIFIED
    ---------------------------------------------------------- */

    if (!data.user.email_confirmed_at) {

      await supabase.auth.signOut();

      throw new Error(
        'Please verify your email before logging in.'
      );
    }


    /* ----------------------------------------------------------
       LOAD PROFILE
    ---------------------------------------------------------- */

    const profile =
      await this.fetchProfile(
        data.user.id
      );


    if (!profile) {

      await supabase.auth.signOut();

      throw new Error(
        'Your account profile is not ready yet. Please contact administration.'
      );
    }


    return profile;
  },


  /* ==========================================================
     SIGN OUT
  ========================================================== */

  async signOut(): Promise<void> {

    const supabase =
      getSupabase();

    const {
      error,
    } =
      await supabase.auth.signOut();

    if (error) {
      throw new Error(
        error.message
      );
    }
  },


  /* ==========================================================
     CURRENT USER
  ========================================================== */

  async getCurrentUser(): Promise<User | null> {

    const supabase =
      getSupabase();


    const {
      data,
      error,
    } =
      await supabase.auth.getSession();


    if (error) {
      throw new Error(
        error.message
      );
    }


    if (!data.session?.user) {
      return null;
    }


    return this.fetchProfile(
      data.session.user.id
    );
  },


  /* ==========================================================
     FETCH PROFILE
  ========================================================== */

  async fetchProfile(
    userId: string
  ): Promise<User | null> {

    const supabase =
      getSupabase();


    const {
      data,
      error,
    } =
      await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();


    if (error) {

      throw new Error(
        `Profile request failed: ${error.message}`
      );
    }


    if (!data) {
      return null;
    }


    return mapProfile(
      data as Record<string, unknown>
    );
  },


  /* ==========================================================
     UPDATE PROFILE
  ========================================================== */

  async updateProfile(
    userId: string,
    updates: Partial<User>
  ): Promise<User> {

    const supabase =
      getSupabase();


    const {
      role: _role,
      account_status: _status,
      requested_role: _requestedRole,
      id: _id,
      email: _email,
      created_at: _createdAt,
      ...safeUpdates
    } = updates;


    void _role;
    void _status;
    void _requestedRole;
    void _id;
    void _email;
    void _createdAt;


    const {
      data,
      error,
    } =
      await supabase
        .from('profiles')
        .update({
          ...safeUpdates,

          updated_at:
            new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();


    if (error) {
      throw new Error(
        error.message
      );
    }


    return mapProfile(
      data as Record<string, unknown>
    );
  },


  /* ==========================================================
     CHANGE PASSWORD
  ========================================================== */

  async changePassword(
    _userId: string,
    _current: string,
    newPassword: string
  ): Promise<void> {

    const supabase =
      getSupabase();


    const {
      error,
    } =
      await supabase.auth.updateUser({
        password:
          newPassword,
      });


    if (error) {
      throw new Error(
        error.message
      );
    }
  },


  /* ==========================================================
     RESET PASSWORD
  ========================================================== */

  async resetPasswordForEmail(
    email: string
  ): Promise<void> {

    const supabase =
      getSupabase();


    const {
      error,
    } =
      await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase()
      );


    if (error) {
      throw new Error(
        error.message
      );
    }
  },


  /* ==========================================================
     AUTH STATE
  ========================================================== */

  async onAuthStateChange(
    callback: (
      user: User | null
    ) => void
  ): Promise<() => void> {

    const supabase =
      getSupabase();


    const {
      data,
    } =
      supabase.auth.onAuthStateChange(
        async (
          event,
          session
        ) => {

          if (
            !session?.user
          ) {

            callback(null);
            return;
          }


          /*
           * Do not query profiles during
           * email verification / initial
           * signup events unnecessarily.
           */

          if (
            event ===
            'PASSWORD_RECOVERY'
          ) {
            callback(null);
            return;
          }


          try {

            const profile =
              await this.fetchProfile(
                session.user.id
              );

            callback(
              profile
            );

          } catch {

            callback(null);
          }
        }
      );


    return () =>
      data.subscription.unsubscribe();
  },


  /* ==========================================================
     ALL USERS
  ========================================================== */

  async getAllUsers(): Promise<User[]> {

    const supabase =
      getSupabase();


    const {
      data,
      error,
    } =
      await supabase
        .from('profiles')
        .select('*')
        .order(
          'created_at',
          {
            ascending:
              false,
          }
        );


    if (error) {
      throw new Error(
        error.message
      );
    }


    return (
      (data as Record<string, unknown>[])
        .map(mapProfile)
    );
  },


  /* ==========================================================
     APPROVE USER
  ========================================================== */

  async approveUser(
    userId: string
  ): Promise<User> {

    const supabase =
      getSupabase();


    const {
      data,
      error,
    } =
      await supabase.rpc(
        'approve_user',
        {
          p_user_id:
            userId,
        }
      );


    if (error) {
      throw new Error(
        error.message
      );
    }


    return mapProfile(
      data as Record<string, unknown>
    );
  },


  /* ==========================================================
     REJECT USER
  ========================================================== */

  async rejectUser(
    userId: string,
    reason?: string
  ): Promise<User> {

    const supabase =
      getSupabase();


    const {
      data,
      error,
    } =
      await supabase.rpc(
        'reject_user',
        {
          p_user_id:
            userId,

          p_reason:
            reason ??
            null,
        }
      );


    if (error) {
      throw new Error(
        error.message
      );
    }


    return mapProfile(
      data as Record<string, unknown>
    );
  },
};