import { Component, OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"
import { ActivatedRoute, Router, RouterLink } from "@angular/router"
import { CampagneService } from "../../../Services/campagne.service"
import { UserService } from "../../../Services/user.service"
import { AuthService } from "../../../Services/auth.service"
import { Campaign, CampaignCompleteRequest, Form, FormQuestion, Option, Product, Question } from "../../../models/campagne.model"
import { User } from "../../../models/utilisateur.model"

@Component({
  selector: 'app-campagne-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './campagne-form.component.html',
  styleUrl: './campagne-form.component.css'
})
export class CampagneFormComponent implements OnInit {
  campaignForm: FormGroup
  loading = false
  submitted = false
  error = ""
  isEditMode = false
  campaignId: number | null = null
  currentUser: User | null = null

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampagneService,
    private userService: UserService,
    private authService: AuthService,
  ) {
    this.campaignForm = this.createCampaignForm()
  }

  ngOnInit(): void {
    // Get the current user from the auth service
    this.currentUser = this.authService.currentUserValue;
    
    // If user is not authenticated, redirect to login
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Check if user has the right role (ADMIN or ANNONCEUR)
    if (this.currentUser.role !== 'ADMIN' && this.currentUser.role !== 'ANNONCEUR') {
      this.router.navigate(['/']);
      return;
    }
    
    // Check if we're in edit mode
    // First check for id in the direct route (campaigns/:id/edit)
    let id = this.route.snapshot.paramMap.get("id");
    
    console.log("Route params:", this.route.snapshot.paramMap);
    console.log("Current route:", this.router.url);
    
    if (id) {
      this.isEditMode = true;
      this.campaignId = +id;
      this.loadCampaign(+id);
    } else {
      // Add at least one question by default
      this.addQuestion();
    }
  }

  get f() {
    return this.campaignForm.controls
  }

  get produitForm() {
    return (this.campaignForm.get("produit") as FormGroup).controls
  }

  get questionsArray() {
    return this.campaignForm.get("formulaire.questions") as FormArray
  }

  getOptionsArray(questionIndex: number) {
    return this.questionsArray.at(questionIndex).get("options") as FormArray
  }

  createCampaignForm(): FormGroup {
    return this.formBuilder.group({
      nom: ["", Validators.required],
      description: ["", Validators.required],
      dateDebut: ["", Validators.required],
      dateFin: ["", Validators.required],
      statut: ["PLANIFIEE", Validators.required],
      produit: this.formBuilder.group({
        nom: ["", Validators.required],
        description: ["", Validators.required],
        categorie: ["", Validators.required],
        noteMoyenne: [0],
      }),
      formulaire: this.formBuilder.group({
        questions: this.formBuilder.array([]),
      }),
    })
  }

  createQuestionGroup(): FormGroup {
    return this.formBuilder.group({
      texte: ["", Validators.required],
      options: this.formBuilder.array([]),
    })
  }

  createOptionGroup(): FormGroup {
    return this.formBuilder.group({
      texte: ["", Validators.required],
    })
  }

  addQuestion(): void {
    this.questionsArray.push(this.createQuestionGroup())
    // Add at least one option by default
    this.addOption(this.questionsArray.length - 1)
  }

  removeQuestion(index: number): void {
    this.questionsArray.removeAt(index)
  }

  addOption(questionIndex: number): void {
    const optionsArray = this.getOptionsArray(questionIndex)
    optionsArray.push(this.createOptionGroup())
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    const optionsArray = this.getOptionsArray(questionIndex)
    optionsArray.removeAt(optionIndex)
  }

  loadCampaign(id: number): void {
    this.campaignService.getCampaignById(id).subscribe({
      next: (campaign) => {
        console.log("Loading campaign for edit:", campaign);
        console.log("Current user:", this.currentUser);
        console.log("Campaign annonceurId:", campaign.annonceurId);
        console.log("User ID:", this.currentUser?.id);
        
        // Log if annonceurId is missing
        if (!campaign.annonceurId) {
          console.log(`Campaign ${campaign.id} has no annonceurId. This may affect permission checks.`);
        }
        
        // Check if the user is authorized to edit this campaign
        if (this.currentUser?.role === 'ANNONCEUR' && campaign.annonceurId !== this.currentUser.id) {
          console.log("Authorization failed: User is not the owner of this campaign");
          console.log("Campaign annonceurId:", campaign.annonceurId);
          console.log("Current user ID:", this.currentUser.id);
          this.error = "You are not authorized to edit this campaign. Only the campaign owner can edit it.";
          this.router.navigate(['/campaigns']);
          return;
        } else if (this.currentUser?.role === 'ANNONCEUR' && campaign.annonceurId === this.currentUser.id) {
          console.log("Authorization successful: User is the owner of this campaign");
        } else if (this.currentUser?.role === 'ADMIN') {
          console.log("Admin user can edit any campaign");
        }
        
        // Populate the form with campaign data
        this.campaignForm.patchValue({
          nom: campaign.nom,
          description: campaign.description,
          dateDebut: this.formatDate(campaign.dateDebut),
          dateFin: this.formatDate(campaign.dateFin),
          statut: campaign.statut,
        })

        // Populate product data if available
        if (campaign.produit) {
          this.campaignForm.get("produit")?.patchValue({
            nom: campaign.produit.nom,
            description: campaign.produit.description,
            categorie: campaign.produit.categorie,
            noteMoyenne: campaign.produit.noteMoyenne,
          })
        }

        // Load form questions and options if available
        if (campaign.formulaire && campaign.formulaire.formulaireQuestions && campaign.formulaire.formulaireQuestions.length > 0) {
          // Clear existing questions
          while (this.questionsArray.length) {
            this.questionsArray.removeAt(0);
          }
          
          // Add questions from the campaign
          campaign.formulaire.formulaireQuestions.forEach(formQuestion => {
            if (formQuestion.question) {
              const questionGroup = this.createQuestionGroup();
              questionGroup.get('texte')?.setValue(formQuestion.question.texte);
              
              // Add question to form
              this.questionsArray.push(questionGroup);
              const questionIndex = this.questionsArray.length - 1;
              
              // Add options if available
              if (formQuestion.question.options && formQuestion.question.options.length > 0) {
                formQuestion.question.options.forEach(option => {
                  const optionGroup = this.createOptionGroup();
                  optionGroup.get('texte')?.setValue(option.texte);
                  this.getOptionsArray(questionIndex).push(optionGroup);
                });
              } else {
                // Add at least one empty option
                this.addOption(questionIndex);
              }
            }
          });
        } else {
          // If no questions exist, add a default one
          this.addQuestion();
        }
      },
      error: (error) => {
        // Check if it's an authentication error
        if (error.status === 401 || error.status === 403) {
          this.error = "Authentication error. Please log in again."
          this.authService.logout();
        } else {
          this.error = "Failed to load campaign"
          console.error(error)
        }
      },
    })
  }

  formatDate(date: Date | string): string {
    if (!date) return ""
    const d = new Date(date)
    return d.toISOString().split("T")[0]
  }
  
  isAuthorized(): boolean {
    console.log("Checking authorization...");
    console.log("Current user:", this.currentUser);
    console.log("Is edit mode:", this.isEditMode);
    console.log("Campaign ID:", this.campaignId);
    
    if (!this.currentUser) {
      console.log("No current user, not authorized");
      return false;
    }
    
    // Admins can edit any campaign
    if (this.currentUser.role === 'ADMIN') {
      console.log("User is admin, authorized");
      return true;
    }
    
    if (this.currentUser.role === 'ANNONCEUR') {
      // For edit mode, check if the user is the owner of the campaign
      if (this.isEditMode && this.campaignId) {
        // The actual ownership check is done in the loadCampaign method
        // Here we just return true because if we got this far, the user passed the check in loadCampaign
        console.log("Edit mode for advertiser, ownership checked in loadCampaign");
        return true;
      }
      
      // For new campaigns, any ANNONCEUR is authorized
      console.log("New campaign for advertiser, authorized");
      return true;
    }
    
    console.log("User has no appropriate role, not authorized");
    return false;
  }

  onSubmit(): void {
    console.log("Form submitted, isEditMode:", this.isEditMode);
    console.log("Campaign ID:", this.campaignId);
    
    this.submitted = true

    if (this.campaignForm.invalid) {
      console.log("Form is invalid:", this.campaignForm.errors);
      return
    }
    
    // Check if user is authorized
    if (!this.isAuthorized()) {
      console.log("User is not authorized");
      this.error = "You are not authorized to perform this action";
      return;
    }

    this.loading = true
    this.error = ""

    // Prepare the campaign data
    const formValue = this.campaignForm.value

    const campaignData: Campaign = {
      id: this.campaignId || 0,
      nom: formValue.nom,
      description: formValue.description,
      dateDebut: new Date(formValue.dateDebut),
      dateFin: new Date(formValue.dateFin),
      statut: formValue.statut
      // annonceurId removed as it's now automatically set by the backend
    }

    const productData: Product = {
      id: 0, // Will be assigned by the backend
      nom: formValue.produit.nom,
      description: formValue.produit.description,
      categorie: formValue.produit.categorie,
      noteMoyenne: formValue.produit.noteMoyenne,
    }

    // Prepare questions and options
    const questions: Question[] = [];
    const formQuestions: FormQuestion[] = [];
    
    // Process each question in the form
    formValue.formulaire.questions.forEach((questionData: any, index: number) => {
      // Create question object
      const question: Question = {
        id: 0, // Will be assigned by the backend
        texte: questionData.texte,
        options: []
      };
      
      // Process options for this question
      if (questionData.options && questionData.options.length > 0) {
        questionData.options.forEach((optionData: any) => {
          const option: Option = {
            id: 0, // Will be assigned by the backend
            texte: optionData.texte
          };
          question.options!.push(option);
        });
      }
      
      questions.push(question);
      
      // Create form question linking
      const formQuestion: FormQuestion = {
        id: 0, // Will be assigned by the backend
        question: question
      };
      
      formQuestions.push(formQuestion);
    });

    // Prepare form data with questions and options
    const formData: Form = {
      id: 0, // Will be assigned by the backend
      formulaireQuestions: formQuestions,
    }

    // Prepare the complete request
    const completeRequest: CampaignCompleteRequest = {
      campagne: campaignData,
      produit: productData,
      formulaire: formData
      // annonceurId removed as it's now automatically set by the backend
    }
    
    // Log the request for debugging
    console.log('Sending campaign request:', JSON.stringify(completeRequest));
    console.log('Current user:', this.currentUser);
    // Annonceur ID is now automatically set by the backend

    if (this.isEditMode) {
      console.log("Updating campaign in edit mode, ID:", this.campaignId);
      
      // For edit mode, use the complete update to ensure all related data is updated
      this.campaignService.updateCompleteCampaign(this.campaignId!, completeRequest).subscribe({
        next: (response) => {
          console.log("Campaign updated successfully:", response);
          this.router.navigate(["/campaigns", this.campaignId]);
        },
        error: (error) => {
          console.error("Error updating complete campaign:", error);
          
          // If the complete update endpoint fails (e.g., 404 Not Found), fall back to the basic update
          if (error.status === 404) {
            console.log("Falling back to basic campaign update");
            
            // Fall back to basic campaign update
            this.campaignService.updateCampaign(this.campaignId!, campaignData).subscribe({
              next: (response) => {
                console.log("Campaign basic update successful:", response);
                this.router.navigate(["/campaigns", this.campaignId]);
              },
              error: (fallbackError) => {
                console.error("Error in fallback update:", fallbackError);
                
                // Check if it's an authentication error
                if (fallbackError.status === 401 || fallbackError.status === 403) {
                  this.error = "Authentication error. Please log in again.";
                  this.authService.logout();
                } else {
                  this.error = fallbackError.error?.message || "Failed to update campaign";
                }
                this.loading = false;
              }
            });
          } else if (error.status === 401 || error.status === 403) {
            this.error = "Authentication error. Please log in again.";
            this.authService.logout();
          } else {
            this.error = error.error?.message || "Failed to update campaign";
            this.loading = false;
          }
        },
      })
    } else {
      this.campaignService.createCompleteCampaign(completeRequest).subscribe({
        next: (campaign) => {
          console.log('Campaign created successfully:', campaign);
          this.router.navigate(["/campaigns", campaign.id])
        },
        error: (error) => {
          console.error('Error creating campaign:', error);
          
          // Check if it's an authentication error
          if (error.status === 401 || error.status === 403) {
            this.error = "Authentication error. Please log in again."
            this.authService.logout();
          } else if (error.status === 400) {
            // Bad request - likely a validation error
            this.error = error.error?.message || "Invalid campaign data. Please check your form."
          } else {
            this.error = error.error?.message || "Failed to create campaign"
          }
          this.loading = false
        },
      })
    }
  }
}
