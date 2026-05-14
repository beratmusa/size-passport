import { useLoaderData, useSubmit } from "react-router";
import { authenticate } from "../shopify.server";
import { supabase } from "../supabase.server";
import { useState } from "react";

export const loader = async ({ request, params }) => {
  await authenticate.admin(request);
  const { id } = params;

  // 1. Ürünü çek
  const { data: product } = await supabase
    .from("merchant_products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) {
    throw new Error("Product not found");
  }

  // 2. Mevcut bedenleri çek
  const { data: sizes } = await supabase
    .from("merchant_product_sizes")
    .select("*")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  return { product, sizes };
};

export const action = async ({ request, params }) => {
  await authenticate.admin(request);
  const { id } = params;
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "save_size") {
    const sizeLabel = formData.get("sizeLabel");
    const measurementsJson = formData.get("measurements");
    const measurements = JSON.parse(measurementsJson);

    // Manual Upsert: First check if it exists to avoid 42P10 error if unique constraint is missing
    const { data: existingSize } = await supabase
      .from("merchant_product_sizes")
      .select("id")
      .eq("product_id", id)
      .eq("size_label", sizeLabel)
      .maybeSingle();

    let error;
    if (existingSize) {
      const { error: updateError } = await supabase
        .from("merchant_product_sizes")
        .update({
          measurements: measurements,
          sort_order: 0
        })
        .eq("id", existingSize.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("merchant_product_sizes")
        .insert({
          product_id: id,
          size_label: sizeLabel,
          measurements: measurements,
          sort_order: 0
        });
      error = insertError;
    }

    if (error) {
      console.error("Supabase Error:", error);
      return { error: error.message };
    }
  } else if (actionType === "update_category") {
    const category = formData.get("category");
    const { error } = await supabase
      .from("merchant_products")
      .update({ category: category })
      .eq("id", id);
    
    if (error) {
      console.error("Supabase Error:", error);
      return { error: error.message };
    }
  } else if (actionType === "delete_size") {
    const sizeId = formData.get("sizeId");
    await supabase.from("merchant_product_sizes").delete().eq("id", sizeId);
  }

  return { success: true };
};

export default function ProductDetail() {
  const { product, sizes } = useLoaderData();
  const submit = useSubmit();
  
  const [newSize, setNewSize] = useState({ 
    label: '', 
    chest: '', 
    waist: '', 
    hip: '',
    shoulder: '', 
    arm: '',
    length: '',
    inseam: '',
    outseam: ''
  });

  // Determine if product is top or bottom based on category
  const detectCategory = (cat) => {
    const topKeywords = ['t-shirt', 'shirt', 'hoodie', 'jacket', 'sweatshirt', 'top', 'blouse', 'coat', 'outerwear', 'kazak', 'hırka', 'ceket', 'mont'];
    const bottomKeywords = ['pants', 'jeans', 'shorts', 'skirt', 'leggings', 'trousers', 'bottom', 'pantolon', 'şort', 'etek', 'tayt'];
    
    const lowerCat = cat?.toLowerCase() || '';
    if (topKeywords.some(kw => lowerCat.includes(kw))) return 'top';
    if (bottomKeywords.some(kw => lowerCat.includes(kw))) return 'bottom';
    return 'top'; // Default to top if unknown
  };

  const currentCategory = product.category?.toLowerCase() === 'top' || product.category?.toLowerCase() === 'bottom' 
    ? product.category.toLowerCase() 
    : detectCategory(product.category);

  const isTop = currentCategory === 'top';

  const handleCategoryChange = (e) => {
    const fd = new FormData();
    fd.append("actionType", "update_category");
    fd.append("category", e.currentTarget.value);
    submit(fd, { method: "post" });
  };

  const handleAddSize = () => {
    if (!newSize.label) return alert("Please enter a size label (e.g. S, M, L)");

    const measurements = {};
    Object.keys(newSize).forEach(key => {
      if (key !== 'label' && newSize[key]) {
        measurements[key] = parseFloat(newSize[key]);
      }
    });
    
    const fd = new FormData();
    fd.append("actionType", "save_size");
    fd.append("sizeLabel", newSize.label);
    fd.append("measurements", JSON.stringify(measurements));
    
    submit(fd, { method: "post" });
    setNewSize({ label: '', chest: '', waist: '', hip: '', shoulder: '', arm: '', length: '', inseam: '', outseam: '' });
  };

  const handleDelete = (sizeId) => {
    if (confirm("Are you sure you want to delete this size?")) {
      const fd = new FormData();
      fd.append("actionType", "delete_size");
      fd.append("sizeId", sizeId);
      submit(fd, { method: "post" });
    }
  };

  return (
    <s-page heading={`Edit Size Chart: ${product.name}`}>
      <s-section heading="Product Category">
        <s-paragraph>
          Detected Category: <strong>{currentCategory.toUpperCase()}</strong> 
          <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6d7175' }}>
            (Based on Shopify Product Type: {product.category || 'N/A'})
          </span>
        </s-paragraph>
        <div style={{ marginTop: '12px', maxWidth: '300px' }}>
          <select 
            value={currentCategory} 
            onChange={handleCategoryChange}
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '8px', 
              border: '1px solid #e1e3e5',
              fontSize: '14px'
            }}
          >
            <option value="top">Top (T-shirt, Jacket, Shirt)</option>
            <option value="bottom">Bottom (Pants, Shorts, Skirt)</option>
          </select>
        </div>
      </s-section>

      <s-section heading="Current Measurements (cm)">
        {!sizes || sizes.length === 0 ? (
          <s-paragraph>No sizes added yet. Use the form below to add measurements for each size.</s-paragraph>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e1e3e5', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Size</th>
                  {isTop ? (
                    <>
                      <th style={{ padding: '12px' }}>Chest</th>
                      <th style={{ padding: '12px' }}>Shoulder</th>
                      <th style={{ padding: '12px' }}>Arm</th>
                      <th style={{ padding: '12px' }}>Length</th>
                      <th style={{ padding: '12px' }}>Waist</th>
                    </>
                  ) : (
                    <>
                      <th style={{ padding: '12px' }}>Waist</th>
                      <th style={{ padding: '12px' }}>Hip</th>
                      <th style={{ padding: '12px' }}>Inseam</th>
                      <th style={{ padding: '12px' }}>Outseam</th>
                    </>
                  )}
                  <th style={{ padding: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sizes.map(size => (
                  <tr key={size.id} style={{ borderBottom: '1px solid #e1e3e5' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{size.size_label}</td>
                    {isTop ? (
                      <>
                        <td style={{ padding: '12px' }}>{size.measurements.chest || '-'}</td>
                        <td style={{ padding: '12px' }}>{size.measurements.shoulder || '-'}</td>
                        <td style={{ padding: '12px' }}>{size.measurements.arm || '-'}</td>
                        <td style={{ padding: '12px' }}>{size.measurements.length || '-'}</td>
                        <td style={{ padding: '12px' }}>{size.measurements.waist || '-'}</td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '12px' }}>{size.measurements.waist || '-'}</td>
                        <td style={{ padding: '12px' }}>{size.measurements.hip || '-'}</td>
                        <td style={{ padding: '12px' }}>{size.measurements.inseam || '-'}</td>
                        <td style={{ padding: '12px' }}>{size.measurements.outseam || '-'}</td>
                      </>
                    )}
                    <td style={{ padding: '12px' }}>
                      <s-button onClick={() => handleDelete(size.id)}>Delete</s-button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </s-section>

      <s-section heading="Add Size Measurements">
        <s-paragraph>Enter the measurements for a new size. All values should be in centimeters (cm).</s-paragraph>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
          <s-text-field label="Size Label" placeholder="e.g. S, M, 42" value={newSize.label} onChange={(e) => setNewSize({...newSize, label: e.currentTarget.value})} />
          
          {isTop ? (
            <>
              <s-text-field label="Chest / Bust" type="number" value={newSize.chest} onChange={(e) => setNewSize({...newSize, chest: e.currentTarget.value})} />
              <s-text-field label="Shoulder" type="number" value={newSize.shoulder} onChange={(e) => setNewSize({...newSize, shoulder: e.currentTarget.value})} />
              <s-text-field label="Arm / Sleeve" type="number" value={newSize.arm} onChange={(e) => setNewSize({...newSize, arm: e.currentTarget.value})} />
              <s-text-field label="Total Length" type="number" value={newSize.length} onChange={(e) => setNewSize({...newSize, length: e.currentTarget.value})} />
              <s-text-field label="Waist (Optional)" type="number" value={newSize.waist} onChange={(e) => setNewSize({...newSize, waist: e.currentTarget.value})} />
            </>
          ) : (
            <>
              <s-text-field label="Waist" type="number" value={newSize.waist} onChange={(e) => setNewSize({...newSize, waist: e.currentTarget.value})} />
              <s-text-field label="Hip" type="number" value={newSize.hip} onChange={(e) => setNewSize({...newSize, hip: e.currentTarget.value})} />
              <s-text-field label="Inseam" type="number" value={newSize.inseam} onChange={(e) => setNewSize({...newSize, inseam: e.currentTarget.value})} />
              <s-text-field label="Outseam" type="number" value={newSize.outseam} onChange={(e) => setNewSize({...newSize, outseam: e.currentTarget.value})} />
            </>
          )}
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <s-button onClick={handleAddSize} variant="primary">Save Size</s-button>
        </div>
      </s-section>
    </s-page>
  );
}
