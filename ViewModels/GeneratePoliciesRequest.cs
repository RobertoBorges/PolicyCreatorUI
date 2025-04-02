using PolicyCreatorUI.Models;

namespace PolicyCreatorUI.ViewModels;

public class GeneratePoliciesRequest
{
    public List<ResourceModel> Resources { get; set; }
}
