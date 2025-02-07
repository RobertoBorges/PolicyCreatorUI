namespace PolicyCreatorUI.Models;

public class ModuleParameter
{
    public string Name { get; set; }
    public string Description { get; set; }
    public string Required { get; set; }
    public string Type { get; set; }
    public string DefaultValue { get; set; }
    public List<string> AllowedValues { get; set; }
}