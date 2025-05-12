import { Component,   OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import {   FormArray,   FormBuilder,   FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"
import {   ActivatedRoute,   Router, RouterLink } from "@angular/router"
import   { CampagneService } from "../../../Services/campagne.service"
import   { UserService } from "../../../Services/user.service"
//import   { AuthService } from "../../../services/auth.service"
import   { Campaign, CampaignCompleteRequest, Form, Product } from "../../../models/campagne.model"
import   { User } from "../../../models/utilisateur.model"

@Component({
  selector: 'app-campagne-form',
  standalone: true,
  imports:  [CommonModule, ReactiveFormsModule, RouterLink],
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
   // private authService: AuthService,
  ) {
    this.campaignForm = this.createCampaignForm()
  }

  ngOnInit(): void {
  //  this.currentUser = this.authService.getCurrentUser()

    // Check if we're in edit mode
    const id = this.route.snapshot.paramMap.get("id")
    if (id) {
      this.isEditMode = true
      this.campaignId = +id
      this.loadCampaign(+id)
    } else {
      // Add at least one question by default
      this.addQuestion()
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

        // Load form questions and options
        // This would require additional API calls to get the form structure
        // For simplicity, we'll just add a default question if none exists
        if (!campaign.formulaire) {
          this.addQuestion()
        }
      },
      error: (error) => {
        this.error = "Failed to load campaign"
        console.error(error)
      },
    })
  }

  formatDate(date: Date | string): string {
    if (!date) return ""
    const d = new Date(date)
    return d.toISOString().split("T")[0]
  }

  onSubmit(): void {
    this.submitted = true

    if (this.campaignForm.invalid) {
      return
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
      statut: formValue.statut,
      annonceur: this.currentUser?.id,
    }

    const productData: Product = {
      id: 0, // Will be assigned by the backend
      nom: formValue.produit.nom,
      description: formValue.produit.description,
      categorie: formValue.produit.categorie,
      noteMoyenne: formValue.produit.noteMoyenne,
    }

    // Prepare form data with questions and options
    const formData: Form = {
      id: 0, // Will be assigned by the backend
      formulaireQuestions: [],
    }

    // Prepare the complete request
    const completeRequest: CampaignCompleteRequest = {
      campagne: campaignData,
      produit: productData,
      formulaire: formData,
    }

    if (this.isEditMode) {
      this.campaignService.updateCampaign(this.campaignId!, campaignData).subscribe({
        next: () => {
          this.router.navigate(["/campaigns", this.campaignId])
        },
        error: (error) => {
          this.error = error.error?.message || "Failed to update campaign"
          this.loading = false
        },
      })
    } else {
      this.campaignService.createCompleteCampaign(completeRequest).subscribe({
        next: (campaign) => {
          this.router.navigate(["/campaigns", campaign.id])
        },
        error: (error) => {
          this.error = error.error?.message || "Failed to create campaign"
          this.loading = false
        },
      })
    }
  }
}
