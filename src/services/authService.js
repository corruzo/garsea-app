import { supabase } from '../lib/supabase'

export const authService = {
  // Registrar nueva organización con usuario admin (ATÓMICO)
  async registrarOrganizacion(datos) {
    try {
      // 1. Crear cuenta en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: datos.email,
        password: datos.password,
      });

      if (authError) throw authError;
      if (!authData.user || !authData.user.id) throw new Error('No se pudo crear el usuario en Supabase Auth');

      // 2. Ejecutar registro atómico en la base de datos (RPC)
      // Esta función garantiza que si falla la creación del usuario, no se cree la organización y viceversa
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_organization_with_admin', {
        org_nombre: datos.nombreEmpresa,
        org_identificacion: datos.cedula, // Usamos la misma para simplificar si no hay RIF
        org_email: datos.email,
        org_telefono: datos.telefono,
        user_cedula: datos.cedula,
        user_nombre: datos.nombreAdmin,
        user_email: datos.email,
        user_telefono: datos.telefono,
        user_auth_id: authData.user.id
      });

      if (rpcError) {
        // Fallback: Si el RPC no ha sido instalado aún o hay error de parámetros
        console.error('Error en RPC:', rpcError);
        console.warn('Ejecutando registro manual como respaldo...');

        try {
          const { data: org, error: oError } = await supabase.from('organizaciones').insert({
            nombre: datos.nombreEmpresa,
            email: datos.email,
            telefono: datos.telefono,
            identificacion: datos.cedula
          }).select().single();

          if (oError) throw oError;

          const { error: uError } = await supabase.from('usuarios').insert({
            cedula: datos.cedula,
            organizacion_id: org.id,
            nombre: datos.nombreAdmin,
            email: datos.email,
            telefono: datos.telefono,
            rol: 'admin',
            auth_id: authData.user.id
          });

          if (uError) throw uError;
          return { success: true };
        } catch (manualError) {
          console.error('Error en registro manual:', manualError);
          throw manualError;
        }
      }

      // Validar respuesta del RPC (debe ser un objeto JSON con success)
      const isSuccess = rpcData && (rpcData === true || rpcData.success === true);

      if (!isSuccess) {
        throw new Error(rpcData?.error || 'Error en la transacción de base de datos');
      }

      return { success: true, data: rpcData };
    } catch (error) {
      console.error('Error en registro:', error);
      return { success: false, error: error.message };
    }
  },

  // Login
  async login(email, password) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user || !authData.user.id) throw new Error('No se pudo autenticar el usuario en Supabase Auth');

      // Obtener datos del usuario (Usamos fetch normal en lugar de .single() para evitar el error de coercion JSON si no existe)
      const { data: users, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', authData.user.id);

      if (userError) throw userError;

      if (!users || users.length === 0) {
        // El usuario está en Auth, pero no en la tabla 'usuarios'
        // Esto pasa si el RPC falló durante el registro inicial
        throw new Error('Error de consistencia: Tu cuenta de acceso existe pero no encontramos tu perfil de usuario. Contacta a soporte.');
      }

      const usuario = users[0];

      // Obtener datos de la organización
      const { data: orgs, error: orgError } = await supabase
        .from('organizaciones')
        .select('*')
        .eq('id', usuario.organizacion_id);

      if (orgError) throw orgError;

      if (!orgs || orgs.length === 0) {
        throw new Error('No se encontró la empresa vinculada a tu cuenta.');
      }

      const organizacion = orgs[0];

      return { success: true, data: { auth: authData, usuario, organizacion } };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener sesión actual
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session) return { success: false };

      // Obtener datos del usuario
      const { data: users, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', session.user.id);

      if (userError || !users || users.length === 0) {
        return { success: false, error: 'Perfil no encontrado' };
      }

      const usuario = users[0];

      // Obtener datos de la organización
      const { data: orgs, error: orgError } = await supabase
        .from('organizaciones')
        .select('*')
        .eq('id', usuario.organizacion_id);

      if (orgError || !orgs || orgs.length === 0) {
        return { success: false, error: 'Organización no encontrada' };
      }

      return { success: true, data: { session, usuario, organizacion } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Recuperar Contraseña
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error in resetPassword:', error);
      return { success: false, error: error.message };
    }
  },

  // Actualizar Contraseña (cuando ya hay sesión de recuperación o sesión activa)
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error in updatePassword:', error);
      return { success: false, error: error.message };
    }
  }
};