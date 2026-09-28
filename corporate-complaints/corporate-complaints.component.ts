import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Complaint, SharedComplaintService } from '../../../services/shared-complaint.service';

@Component({
  selector: 'app-corporate-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './corporate-complaints.component.html',
  styleUrls: ['./corporate-complaints.component.css']
})
export class CorporateComplaintsComponent implements OnInit {
  complaints: Complaint[] = [];
  filteredComplaints: Complaint[] = [];
  
  // Selected view state
  selectedComplaint: Complaint | null = null;
  isDetailView = false;
  isClosingModalOpen = false;

  // Form fields for updating status / closing
  newStatusSelection: Complaint['status'] = 'In Progress';
  resolutionSummaryInput = '';
  closingRemarksInput = '';

  // Filter & Search criteria
  filterStatus = 'All';
  filterPriority = 'All';
  filterCategory = 'All';
  searchQuery = '';

  // Summary KPIs
  totalCount = 0;
  openCount = 0;
  inProgressCount = 0;
  resolvedCount = 0;
  closedCount = 0;
  criticalCount = 0;
  highCount = 0;
  mediumCount = 0;
  lowCount = 0;

  constructor(private complaintService: SharedComplaintService) {}

  ngOnInit(): void {
    this.complaintService.getComplaintsObservable().subscribe(data => {
      this.complaints = data;
      this.applyFilters();
      this.calculateKPIs();
    });
  }

  calculateKPIs(): void {
    this.totalCount = this.complaints.length;
    this.openCount = this.complaints.filter(c => c.status === 'Open').length;
    this.inProgressCount = this.complaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned' || c.status === 'On Hold').length;
    this.resolvedCount = this.complaints.filter(c => c.status === 'Resolved').length;
    this.closedCount = this.complaints.filter(c => c.status === 'Closed').length;

    this.criticalCount = this.complaints.filter(c => c.priority === 'Critical').length;
    this.highCount = this.complaints.filter(c => c.priority === 'High').length;
    this.mediumCount = this.complaints.filter(c => c.priority === 'Medium').length;
    this.lowCount = this.complaints.filter(c => c.priority === 'Low').length;
  }

  applyFilters(): void {
    this.filteredComplaints = this.complaints.filter(c => {
      const matchStatus = this.filterStatus === 'All' || c.status === this.filterStatus;
      const matchPriority = this.filterPriority === 'All' || c.priority === this.filterPriority;
      const matchCategory = this.filterCategory === 'All' || c.category === this.filterCategory;
      
      const query = this.searchQuery.toLowerCase().trim();
      const matchSearch = !query || 
        c.id.toLowerCase().includes(query) ||
        c.subject.toLowerCase().includes(query) ||
        c.customerName.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query) ||
        c.status.toLowerCase().includes(query);

      return matchStatus && matchPriority && matchCategory && matchSearch;
    });
  }

  openComplaintDetail(complaint: Complaint): void {
    this.selectedComplaint = complaint;
    this.newStatusSelection = complaint.status;
    this.isDetailView = true;
  }

  backToList(): void {
    this.selectedComplaint = null;
    this.isDetailView = false;
    this.isClosingModalOpen = false;
  }

  updateStatus(): void {
    if (this.selectedComplaint) {
      this.complaintService.updateComplaintStatus(this.selectedComplaint.id, this.newStatusSelection);
      // Refresh selected object reference
      const updated = this.complaints.find(c => c.id === this.selectedComplaint?.id);
      if (updated) {
        this.selectedComplaint = updated;
      }
      alert(`Complaint status successfully updated to ${this.newStatusSelection}. Changes reflect immediately across portals.`);
    }
  }

  openCloseModal(): void {
    this.resolutionSummaryInput = this.selectedComplaint?.resolutionSummary || '';
    this.closingRemarksInput = this.selectedComplaint?.closingRemarks || '';
    this.isClosingModalOpen = true;
  }

  cancelClose(): void {
    this.isClosingModalOpen = false;
  }

  confirmCloseComplaint(): void {
    if (this.selectedComplaint) {
      this.complaintService.closeComplaint(
        this.selectedComplaint.id, 
        this.resolutionSummaryInput || 'Resolved and verified by Corporate Marketing.',
        this.closingRemarksInput || 'Customer confirmed resolution.'
      );
      const updated = this.complaints.find(c => c.id === this.selectedComplaint?.id);
      if (updated) {
        this.selectedComplaint = updated;
      }
      this.isClosingModalOpen = false;
      alert('Complaint has been successfully closed.');
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'Critical': return 'badge-critical';
      case 'High': return 'badge-high';
      case 'Medium': return 'badge-medium';
      case 'Low': return 'badge-low';
      default: return '';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Open': return 'status-open';
      case 'Assigned': return 'status-assigned';
      case 'In Progress': return 'status-progress';
      case 'On Hold': return 'status-hold';
      case 'Resolved': return 'status-resolved';
      case 'Closed': return 'status-closed';
      default: return '';
    }
  }
}