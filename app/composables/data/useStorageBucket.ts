export const useStorageBucket = () => {
  const { $supabase } = useNuxtApp();
  const config = useRuntimeConfig();

  const uploadFile = async (bucket: string, filePath: string, file: File) => {
    const { data, error } = await $supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    return data;
  };

  const removeFile = async (bucket: string, filePath: string) => {
    const { error } = await $supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.warn(`Failed to remove file from ${bucket}:`, error);
    }
  };

  const getPublicUrl = (bucket: string, filePath: string) => {
    const projectId = config.public.supabaseProjectId;
    return `https://${projectId}.supabase.co/storage/v1/object/public/${bucket}/${filePath}`;
  };

  return {
    uploadFile,
    removeFile,
    getPublicUrl,
  };
};
