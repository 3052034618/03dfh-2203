import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, MoreVertical, Copy, Trash2, ToggleLeft, ToggleRight, Edit, Eye, MapPin } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import CarriageDiagram from "@/components/CarriageDiagram";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | "trunk" | "city" | "pharmacy" | "custom";

export default function TemplateList() {
  const navigate = useNavigate();
  const { templates, toggleTemplateStatus, duplicateTemplate, deleteTemplate } = useAppStore();
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const categories = [
    { key: "all", label: "全部", count: templates.length },
    { key: "trunk", label: "干线运输", count: templates.filter((t) => t.category === "trunk").length },
    { key: "city", label: "城市配送", count: templates.filter((t) => t.category === "city").length },
    { key: "pharmacy", label: "医药专线", count: templates.filter((t) => t.category === "pharmacy").length },
  ];

  const filteredTemplates = templates.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(searchText.toLowerCase()) ||
      t.description.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = categoryFilter === "all" || t.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const getSensitivityLabel = (level: string) => {
    const labels: Record<string, string> = {
      normal: "普通",
      sensitive: "敏感",
      "highly-sensitive": "高敏感",
    };
    return labels[level] || level;
  };

  const getSensitivityColor = (level: string) => {
    const colors: Record<string, string> = {
      normal: "text-gray-400 bg-gray-500/10 border-gray-500/30",
      sensitive: "text-warning-400 bg-warning-500/10 border-warning-500/30",
      "highly-sensitive": "text-danger-400 bg-danger-500/10 border-danger-500/30",
    };
    return colors[level] || "";
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateTemplate(id);
    setActiveMenu(null);
  };

  const handleToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTemplateStatus(id);
    setActiveMenu(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("确定要删除此模板吗？")) {
      deleteTemplate(id);
    }
    setActiveMenu(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">线路模板管理</h1>
          <p className="text-sm text-gray-400 mt-1">管理不同运输场景的探头布控方案模板</p>
        </div>
        <button
          onClick={() => navigate("/templates/new")}
          className="btn-glow px-5 py-2.5 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          新建模板
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-cold-800/50 rounded-xl p-1.5 border border-ice-500/10">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key as CategoryFilter)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                categoryFilter === cat.key
                  ? "bg-ice-500/15 text-ice-400 border border-ice-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              {cat.label}
              <span className="ml-1.5 text-xs opacity-60">({cat.count})</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="搜索模板名称..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="input-field pl-10 w-72"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="glass-card overflow-hidden group hover:shadow-xl hover:shadow-ice-500/5 transition-all duration-300 cursor-pointer"
            onClick={() => navigate(`/templates/${template.id}`)}
          >
            <div className="p-4 bg-gradient-to-br from-cold-700/50 to-cold-800/50 border-b border-ice-500/10">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-ice-300 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{template.description}</p>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === template.id ? null : template.id);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {activeMenu === template.id && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-cold-700 border border-ice-500/20 rounded-lg shadow-xl z-10 py-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/templates/${template.id}`); setActiveMenu(null); }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" /> 查看详情
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/templates/${template.id}?edit=true`); setActiveMenu(null); }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" /> 编辑
                      </button>
                      <button
                        onClick={(e) => handleDuplicate(template.id, e)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" /> 复制
                      </button>
                      <button
                        onClick={(e) => handleToggle(template.id, e)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                      >
                        {template.status === "active" ? (
                          <><ToggleLeft className="w-4 h-4" /> 停用</>
                        ) : (
                          <><ToggleRight className="w-4 h-4" /> 启用</>
                        )}
                      </button>
                      <div className="my-1 border-t border-ice-500/10"></div>
                      <button
                        onClick={(e) => handleDelete(template.id, e)}
                        className="w-full px-3 py-2 text-left text-sm text-danger-400 hover:bg-danger-500/10 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> 删除
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`tag tag-${template.category}`}>{template.categoryName}</span>
                <span className={`tag border ${getSensitivityColor(template.sensitivityLevel)}`}>
                  {getSensitivityLabel(template.sensitivityLevel)}
                </span>
                <span className={cn(
                  "tag",
                  template.status === "active"
                    ? "bg-success-500/10 text-success-400 border border-success-500/30"
                    : "bg-gray-500/10 text-gray-400 border border-gray-500/30"
                )}>
                  {template.status === "active" ? "启用中" : "已停用"}
                </span>
              </div>
            </div>

            <div className="p-4">
              <div className="bg-cold-900/50 rounded-lg p-3 mb-4">
                <CarriageDiagram
                  zones={template.zones}
                  points={template.points}
                  showLabels={false}
                  width={400}
                  height={140}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold font-num text-ice-300">{template.carriage.length}m</p>
                  <p className="text-xs text-gray-500">车厢长度</p>
                </div>
                <div>
                  <p className="text-lg font-bold font-num text-purple-400">{template.zones.length}</p>
                  <p className="text-xs text-gray-500">温区数</p>
                </div>
                <div>
                  <p className="text-lg font-bold font-num text-success-400">{template.points.length}</p>
                  <p className="text-xs text-gray-500">监测点</p>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 bg-cold-800/30 border-t border-ice-500/10 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                已使用 <span className="text-gray-300 font-num">{template.usageCount}</span> 次
              </div>
              <div className="text-xs text-gray-500">
                更新于 {new Date(template.updatedAt).toLocaleDateString("zh-CN")}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-16">
          <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">暂无匹配的模板</p>
        </div>
      )}
    </div>
  );
}
