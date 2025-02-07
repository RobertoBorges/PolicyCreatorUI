using Microsoft.AspNetCore.Mvc;

namespace PolicyCreatorUI.Controllers
{
    public class ResourceController : Controller
    {
        // GET: /Resource/
        public IActionResult Index()
        {
            return View();
        }
    }
}
