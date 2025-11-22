import { supabase, Database } from './supabaseClient';
import type { StoryboardProject } from '../types/storyboard';

type ProjectRow = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

export interface CloudSyncResult {
    success: boolean;
    error?: string;
}

export const cloudStorageService = {
    /**
     * Upload a project to the cloud
     */
    async uploadProject(project: StoryboardProject, userId: string): Promise<CloudSyncResult> {
        try {
            const projectData: ProjectInsert = {
                id: project.id,
                user_id: userId,
                title: project.title,
                description: project.description || null,
                user_input: project.userInput || null,
                project_type: project.projectType as string,
                project_data: project, // Store full project as JSON
                created_at: project.createdAt.toISOString(),
                updated_at: project.updatedAt.toISOString(),
            };

            const { error } = await supabase
                .from('projects')
                .upsert(projectData, {
                    onConflict: 'id',
                });

            if (error) {
                console.error('[cloudStorageService] Error uploading project:', error);
                return {
                    success: false,
                    error: error.message,
                };
            }

            console.log('[cloudStorageService] Project uploaded successfully:', project.id);
            return { success: true };
        } catch (error) {
            console.error('[cloudStorageService] Failed to upload project:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Upload failed',
            };
        }
    },

    /**
   * Download all projects for a user from the cloud
   */
    async downloadProjects(userId: string): Promise<StoryboardProject[]> {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[cloudStorageService] Error downloading projects:', error);
                return [];
            }

            if (!data || data.length === 0) {
                console.log('[cloudStorageService] No projects found in cloud');
                return [];
            }

            // Convert database rows to StoryboardProject objects
            const projects: StoryboardProject[] = data.map((row) => {
                const projectData = row.project_data as StoryboardProject;

                // Ensure dates are properly converted from strings to Date objects
                return {
                    ...projectData,
                    id: row.id, // Use the database ID
                    createdAt: new Date(row.created_at),
                    updatedAt: new Date(row.updated_at),
                    // Ensure all required fields exist
                    title: projectData.title || row.title,
                    description: projectData.description || row.description || '',
                    userInput: projectData.userInput || row.user_input || '',
                    projectType: projectData.projectType || row.project_type,
                };
            });

            console.log('[cloudStorageService] Downloaded', projects.length, 'projects from cloud');
            return projects;
        } catch (error) {
            console.error('[cloudStorageService] Failed to download projects:', error);
            return [];
        }
    },

    /**
     * Delete a project from the cloud
     */
    async deleteProject(projectId: string, userId: string): Promise<CloudSyncResult> {
        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId)
                .eq('user_id', userId);

            if (error) {
                console.error('[cloudStorageService] Error deleting project:', error);
                return {
                    success: false,
                    error: error.message,
                };
            }

            console.log('[cloudStorageService] Project deleted successfully:', projectId);
            return { success: true };
        } catch (error) {
            console.error('[cloudStorageService] Failed to delete project:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Delete failed',
            };
        }
    },

    /**
     * Upload an image to Supabase Storage
     */
    async uploadImage(
        imageUri: string,
        userId: string,
        projectId: string,
        panelId: string
    ): Promise<{ success: boolean; url?: string; error?: string }> {
        try {
            // Convert image URI to blob for upload
            const response = await fetch(imageUri);
            const blob = await response.blob();

            const fileName = `${userId}/${projectId}/${panelId}.png`;

            const { data, error } = await supabase.storage
                .from('generated-images')
                .upload(fileName, blob, {
                    contentType: 'image/png',
                    upsert: true,
                });

            if (error) {
                console.error('[cloudStorageService] Error uploading image:', error);
                return {
                    success: false,
                    error: error.message,
                };
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('generated-images')
                .getPublicUrl(fileName);

            console.log('[cloudStorageService] Image uploaded successfully:', fileName);
            return {
                success: true,
                url: urlData.publicUrl,
            };
        } catch (error) {
            console.error('[cloudStorageService] Failed to upload image:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Image upload failed',
            };
        }
    },

    /**
     * Get image URL from storage
     */
    getImageUrl(userId: string, projectId: string, panelId: string): string {
        const fileName = `${userId}/${projectId}/${panelId}.png`;
        const { data } = supabase.storage
            .from('generated-images')
            .getPublicUrl(fileName);

        return data.publicUrl;
    },
};
