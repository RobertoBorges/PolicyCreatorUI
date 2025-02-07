namespace PolicyCreatorUI.Models;

public class AvmModule
{
    public string Folder { get; set; }
    public string ResourceType { get; set; } = "";
    public List<ModuleParameter> Parameters { get; set; } = new List<ModuleParameter>();
    public DateTime LastUpdated { get; set; } 
}