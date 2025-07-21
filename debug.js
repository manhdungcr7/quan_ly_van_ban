// Simple debug script
console.log('Debug script loaded');

// Test 1: Direct function call
function testDirectOpenModal() {
    console.log('Testing direct openDocumentModal...');
    if (typeof window.openDocumentModal === 'function') {
        console.log('✓ openDocumentModal exists');
        window.openDocumentModal('incoming');
    } else {
        console.log('✗ openDocumentModal not found');
    }
}

// Test 2: Check if elements exist
function testElements() {
    console.log('Testing elements...');
    const elements = ['documentModal', 'previewModal', 'modalTitle'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`Element ${id}: ${element ? 'exists' : 'missing'}`);
    });
}

// Test 3: Check DocumentManager
function testDocumentManager() {
    console.log('Testing DocumentManager...');
    if (window.documentManager) {
        console.log('✓ DocumentManager exists');
        console.log('Documents count:', window.documentManager.documents.length);
        
        // Test methods
        const methods = ['openDocumentModal', 'previewDocument', 'editDocument', 'deleteDocument'];
        methods.forEach(method => {
            if (typeof window.documentManager[method] === 'function') {
                console.log(`✓ Method ${method} exists`);
            } else {
                console.log(`✗ Method ${method} missing`);
            }
        });
    } else {
        console.log('✗ DocumentManager not found');
    }
}

// Auto-test after DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, running tests...');
    
    setTimeout(() => {
        testDirectOpenModal();
        testElements();
        testDocumentManager();
    }, 1000);
});
