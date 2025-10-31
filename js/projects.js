// Projects Management System
class PortfolioManager {
    constructor() {
        this.projects = [];
        this.adminMode = false;
        this.currentEditingId = null;
        this.init();
    }

    async init() {
        await this.loadProjects();
        this.renderProjects();
        this.checkAdminMode();
        this.setupEventListeners();
    }

    async loadProjects() {
        try {
            const response = await fetch('data/projects.json');
            const data = await response.json();
            this.projects = data.projects || [];
        } catch (error) {
            console.error('Error loading projects:', error);
            this.projects = [];
        }
    }

    async saveProjects() {
        try {
            // In a real app, you would send this to a server
            // For now, we'll just update the local storage
            localStorage.setItem('portfolio_projects', JSON.stringify({ projects: this.projects }, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving projects:', error);
            return false;
        }
    }

    renderProjects() {
        const projectsContainer = document.getElementById('projects-container');
        if (!projectsContainer) return;

        if (this.projects.length === 0) {
            projectsContainer.innerHTML = `
                <div class="col-span-full text-center py-10">
                    <p class="text-gray-600 dark:text-gray-300">لا توجد مشاريع مضافة بعد</p>
                    ${this.adminMode ? `
                        <button id="add-project-btn" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            إضافة مشروع جديد
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }

        projectsContainer.innerHTML = this.projects.map(project => `
            <div class="relative group" data-id="${project.id}">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl">
                    <div class="relative h-48 overflow-hidden">
                        <img src="${project.image}" alt="${project.title}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                            ${project.demo ? `
                                <a href="${project.demo}" target="_blank" class="p-2 bg-white/90 text-gray-900 rounded-full hover:bg-white transition-colors">
                                    <i class="fas fa-external-link-alt"></i>
                                </a>
                            ` : ''}
                            ${project.github ? `
                                <a href="${project.github}" target="_blank" class="p-2 bg-white/90 text-gray-900 rounded-full hover:bg-white transition-colors">
                                    <i class="fab fa-github"></i>
                                </a>
                            ` : ''}
                            ${this.adminMode ? `
                                <button class="edit-project p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors" data-id="${project.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="delete-project p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors" data-id="${project.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="p-6 flex-grow flex flex-col">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">${project.title}</h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-4 flex-grow">${project.description}</p>
                        <div class="flex flex-wrap gap-2 mt-auto">
                            ${project.tags.map(tag => `
                                <span class="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">
                                    ${tag}
                                </span>
                            `).join('')}
                        </div>
                        <div class="mt-4 text-sm text-gray-500">
                            ${new Date(project.date).toLocaleDateString('ar-EG')}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Add admin controls if in admin mode
        if (this.adminMode) {
            const addButton = document.createElement('button');
            addButton.id = 'add-project-btn';
            addButton.className = 'fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors';
            addButton.innerHTML = '<i class="fas fa-plus text-xl"></i>';
            addButton.title = 'إضافة مشروع جديد';
            document.body.appendChild(addButton);
        }
    }

    showProjectForm(project = null) {
        const formHtml = `
            <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                                ${project ? 'تعديل المشروع' : 'إضافة مشروع جديد'}
                            </h3>
                            <button id="close-form" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        
                        <form id="project-form" class="space-y-4">
                            <input type="hidden" id="project-id" value="${project?.id || ''}">
                            
                            <div>
                                <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    عنوان المشروع
                                </label>
                                <input type="text" id="title" required 
                                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    value="${project?.title || ''}">
                            </div>
                            
                            <div>
                                <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    الوصف
                                </label>
                                <textarea id="description" rows="3" required
                                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">${project?.description || ''}</textarea>
                            </div>
                            
                            <div>
                                <label for="image" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    رابط الصورة
                                </label>
                                <input type="url" id="image" required
                                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    value="${project?.image || ''}">
                            </div>
                            
                            <div>
                                <label for="tags" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    الوسوم (مفصولة بفواصل)
                                </label>
                                <input type="text" id="tags"
                                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    value="${project?.tags?.join(', ') || ''}">
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label for="github" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        رابط GitHub (اختياري)
                                    </label>
                                    <input type="url" id="github"
                                        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                        value="${project?.github || ''}">
                                </div>
                                
                                <div>
                                    <label for="demo" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        رابط المعاينة (اختياري)
                                    </label>
                                    <input type="url" id="demo"
                                        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                        value="${project?.demo || ''}">
                                </div>
                            </div>
                            
                            <div class="flex justify-end space-x-3 pt-4">
                                <button type="button" id="cancel-form" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    إلغاء
                                </button>
                                <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    ${project ? 'حفظ التغييرات' : 'إضافة المشروع'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        const formContainer = document.createElement('div');
        formContainer.id = 'project-form-container';
        formContainer.innerHTML = formHtml;
        document.body.appendChild(formContainer);

        // Add event listeners
        document.getElementById('close-form')?.addEventListener('click', () => {
            document.body.removeChild(formContainer);
        });

        document.getElementById('cancel-form')?.addEventListener('click', () => {
            document.body.removeChild(formContainer);
        });

        document.getElementById('project-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
    }

    async handleFormSubmit() {
        const form = document.getElementById('project-form');
        if (!form) return;

        const projectData = {
            id: document.getElementById('project-id').value || Date.now(),
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            image: document.getElementById('image').value,
            tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(Boolean),
            github: document.getElementById('github').value || null,
            demo: document.getElementById('demo').value || null,
            date: new Date().toISOString().split('T')[0]
        };

        if (projectData.id && projectData.id !== 'new') {
            // Update existing project
            const index = this.projects.findIndex(p => p.id == projectData.id);
            if (index !== -1) {
                // Keep the original date if editing
                projectData.date = this.projects[index].date;
                this.projects[index] = projectData;
            }
        } else {
            // Add new project
            projectData.id = Date.now();
            this.projects.unshift(projectData);
        }

        await this.saveProjects();
        this.renderProjects();
        
        // Close the form
        const formContainer = document.getElementById('project-form-container');
        if (formContainer) {
            document.body.removeChild(formContainer);
        }
    }

    async deleteProject(id) {
        if (!confirm('هل أنت متأكد من حذف هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء.')) {
            return;
        }

        this.projects = this.projects.filter(project => project.id != id);
        await this.saveProjects();
        this.renderProjects();
    }

    checkAdminMode() {
        // In a real app, you would implement proper authentication
        // For this example, we'll use a simple URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        this.adminMode = urlParams.get('admin') === 'true';
        
        if (this.adminMode) {
            document.body.classList.add('admin-mode');
            console.log('Admin mode activated');
        }
    }

    setupEventListeners() {
        // Use event delegation for dynamic elements
        document.addEventListener('click', async (e) => {
            // Add project button
            if (e.target.closest('#add-project-btn')) {
                e.preventDefault();
                this.showProjectForm();
            }
            
            // Edit project button
            const editBtn = e.target.closest('.edit-project');
            if (editBtn) {
                e.preventDefault();
                const projectId = parseInt(editBtn.dataset.id);
                const project = this.projects.find(p => p.id === projectId);
                if (project) {
                    this.showProjectForm(project);
                }
            }
            
            // Delete project button
            const deleteBtn = e.target.closest('.delete-project');
            if (deleteBtn) {
                e.preventDefault();
                const projectId = parseInt(deleteBtn.dataset.id);
                this.deleteProject(projectId);
            }
        });
    }
}

// Initialize the portfolio manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.portfolioManager = new PortfolioManager();
});
